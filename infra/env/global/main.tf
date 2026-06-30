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
      Environment = "global"
    }
  }
}

# DNS Module (Shared across all envs)
module "dns" {
  source      = "../../modules/dns"
  domain_name = "average.dev"
  
  tags = {
    Application = "shared-infrastructure"
  }
}

# GitHub Actions OIDC Provider
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  # AWS automatically trusts GitHub's root CA now, but we provide the standard thumbprints just in case
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1", "1c58a3a8518e8759bf075b76b750d4f2df264fcd"]

  tags = {
    Application = "shared-infrastructure"
  }
}
