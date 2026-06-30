output "name_servers" {
  value       = module.dns.name_servers
  description = "Update your Squarespace DNS with these Name Servers"
}

output "zone_id" {
  value = module.dns.zone_id
}

output "certificate_arn" {
  value = module.dns.certificate_arn
}

output "github_oidc_provider_arn" {
  value = aws_iam_openid_connect_provider.github.arn
}
