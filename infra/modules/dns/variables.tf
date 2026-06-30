variable "domain_name" {
  type        = string
  description = "The root domain name (e.g. average.dev)"
}

variable "tags" {
  type        = map(string)
  description = "Tags to apply to resources"
  default     = {}
}
