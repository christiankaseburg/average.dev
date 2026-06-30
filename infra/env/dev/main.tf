terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
  default_tags {
    tags = {
      Project     = "average.dev"
      Environment = "dev"
    }
  }
}

data "aws_route53_zone" "main" {
  name = "average.dev"
}

data "aws_acm_certificate" "main" {
  domain   = "average.dev"
  statuses = ["ISSUED"]
}

data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

module "average_dev_web" {
  source          = "../../modules/average-dev-web"
  bucket_name     = "average-dev-web-dev"
  domain_name     = "dev.average.dev"
  hosted_zone_id  = data.aws_route53_zone.main.id
  certificate_arn = data.aws_acm_certificate.main.arn
  
  tags = {
    Application = "average-dev-web"
  }
}

# GitHub Actions OIDC Role for Dev
resource "aws_iam_role" "github_actions" {
  name = "github-actions-deploy-web-dev"

  tags = {
    Application = "average-dev-web"
  }

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = data.aws_iam_openid_connect_provider.github.arn
        }
        Condition = {
          StringLike = {
            "token.actions.githubusercontent.com:sub": [
              "repo:christiankaseburg/average.dev:ref:refs/heads/dev*",
              "repo:christiankaseburg/average.dev:ref:refs/heads/main"
            ]
          }
          StringEquals = {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
          }
        }
      }
    ]
  })
}

# Allow GitHub Actions to sync to the S3 bucket and invalidate CloudFront
resource "aws_iam_role_policy" "github_actions" {
  name = "github-actions-deploy-policy"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Effect   = "Allow"
        Resource = [
          "arn:aws:s3:::average-dev-web-dev",
          "arn:aws:s3:::average-dev-web-dev/*"
        ]
      },
      {
        Action = [
          "cloudfront:CreateInvalidation"
        ]
        Effect   = "Allow"
        Resource = [
          "arn:aws:cloudfront::*:distribution/${module.average_dev_web.cloudfront_distribution_id}"
        ]
      }
    ]
  })
}

# Note: The role needs additional permissions if GitHub Actions is running `tofu apply`.
# For simplicity, we are assigning Admin access here for IaC. In production, restrict this.
resource "aws_iam_role_policy_attachment" "github_actions_admin" {
  role       = aws_iam_role.github_actions.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}
