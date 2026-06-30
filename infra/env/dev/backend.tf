# Placeholder for remote state. See infra/README.md for instructions.
terraform {
  backend "s3" {
    bucket         = "average-dev-tofu-state-bucket"
    key            = "env/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "average-dev-tofu-state-lock"
    encrypt        = true
  }
}
