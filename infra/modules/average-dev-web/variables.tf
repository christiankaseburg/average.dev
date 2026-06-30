variable "bucket_name" {
  type        = string
  description = "Name of the S3 bucket"
}

variable "domain_name" {
  type        = string
  description = "The fully qualified domain name for the web app (e.g. dev.average.dev)"
}

variable "certificate_arn" {
  type        = string
  description = "The ARN of the ACM certificate for the CloudFront distribution"
}

variable "hosted_zone_id" {
  type        = string
  description = "The ID of the Route53 hosted zone to create the A record in"
}

variable "tags" {
  type        = map(string)
  description = "Tags to apply to resources"
  default     = {}
}
