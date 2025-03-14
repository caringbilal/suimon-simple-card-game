# Frontend Infrastructure Configuration (Temporarily disabled)

# S3 bucket for frontend static files
# resource "aws_s3_bucket" "frontend" {
#   bucket = "suimon-game-frontend"
# }

# resource "aws_s3_bucket_public_access_block" "frontend" {
#   bucket = aws_s3_bucket.frontend.id

#   block_public_acls       = true
#   block_public_policy     = true
#   ignore_public_acls      = true
#   restrict_public_buckets = true
# }

# resource "aws_s3_bucket_versioning" "frontend" {
#   bucket = aws_s3_bucket.frontend.id
#   versioning_configuration {
#     status = "Enabled"
#   }
# }

# CloudFront distribution
# resource "aws_cloudfront_distribution" "frontend" {
#   enabled             = true
#   default_root_object = "index.html"

#   origin {
#     domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
#     origin_id   = "S3-${aws_s3_bucket.frontend.bucket}"

#     s3_origin_config {
#       origin_access_identity = aws_cloudfront_origin_access_identity.frontend.cloudfront_access_identity_path
#     }
#   }

#   default_cache_behavior {
#     allowed_methods        = ["GET", "HEAD"]
#     cached_methods         = ["GET", "HEAD"]
#     target_origin_id       = "S3-${aws_s3_bucket.frontend.bucket}"
#     viewer_protocol_policy = "redirect-to-https"

#     forwarded_values {
#       query_string = false
#       cookies {
#         forward = "none"
#       }
#     }

#     min_ttl     = 0
#     default_ttl = 3600
#     max_ttl     = 86400
#   }

#   restrictions {
#     geo_restriction {
#       restriction_type = "none"
#     }
#   }

#   viewer_certificate {
#     cloudfront_default_certificate = true
#   }
# }

# CloudFront Origin Access Identity
# resource "aws_cloudfront_origin_access_identity" "frontend" {
#   comment = "OAI for Suimon game frontend"
# }

# S3 bucket policy
# resource "aws_s3_bucket_policy" "frontend" {
#   bucket = aws_s3_bucket.frontend.id

#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Sid       = "AllowCloudFrontAccess"
#         Effect    = "Allow"
#         Principal = {
#           AWS = aws_cloudfront_origin_access_identity.frontend.iam_arn
#         }
#         Action   = "s3:GetObject"
#         Resource = "${aws_s3_bucket.frontend.arn}/*"
#       }
#     ]
#   })
# }

# Output CloudFront URL
# output "cloudfront_url" {
#   value = aws_cloudfront_distribution.frontend.domain_name
# }