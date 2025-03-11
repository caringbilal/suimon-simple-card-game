# AWS Infrastructure Configuration

provider "aws" {
  region = "us-west-2"  # Change this to your preferred region
}

# VPC Configuration
resource "aws_vpc" "suimon_vpc" {
  cidr_block = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support = true

  tags = {
    Name = "suimon-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "suimon_igw" {
  vpc_id = aws_vpc.suimon_vpc.id

  tags = {
    Name = "suimon-igw"
  }
}

# Public Subnet
resource "aws_subnet" "suimon_public_subnet" {
  vpc_id     = aws_vpc.suimon_vpc.id
  cidr_block = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone = "us-west-2a"

  tags = {
    Name = "suimon-public-subnet"
  }
}

# Route Table
resource "aws_route_table" "suimon_public_rt" {
  vpc_id = aws_vpc.suimon_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.suimon_igw.id
  }

  tags = {
    Name = "suimon-public-rt"
  }
}

# Route Table Association
resource "aws_route_table_association" "suimon_public_rta" {
  subnet_id      = aws_subnet.suimon_public_subnet.id
  route_table_id = aws_route_table.suimon_public_rt.id
}

# Key pair for EC2 SSH access
resource "aws_key_pair" "backend_key" {
  key_name   = "suimon-backend-key"
  public_key = file("${path.module}/suimon-backend-key.pub")
}

# EC2 Instance for Backend
resource "aws_instance" "backend_server" {
  ami           = "ami-0735c191cf914754d"  # Amazon Linux 2023 AMI in us-west-2
  instance_type = "t2.micro"
  subnet_id     = aws_subnet.suimon_public_subnet.id
  key_name      = aws_key_pair.backend_key.key_name

  vpc_security_group_ids = [aws_security_group.backend_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y nodejs npm
              cd /home/ec2-user
              git clone https://github.com/bilal-abraham/suimon-simple-card-game.git
              cd suimon-simple-card-game/suimon-game/backend
              npm install
              npm start
              EOF

  tags = {
    Name = "suimon-backend-server"
  }
}

# S3 Bucket for Frontend
resource "aws_s3_bucket" "frontend_bucket" {
  bucket = "suimon-game-frontend"
}

# Create Origin Access Identity for CloudFront
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for Suimon Game Frontend"
}

# Update bucket policy to only allow access from CloudFront OAI
resource "aws_s3_bucket_policy" "frontend_bucket_policy" {
  bucket = aws_s3_bucket.frontend_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipal"
        Effect    = "Allow"
        Principal = {
          AWS = "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${aws_cloudfront_origin_access_identity.oai.id}"
        }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend_bucket.arn}/*"
      }
    ]
  })
}

# Block public access to S3 bucket
resource "aws_s3_bucket_public_access_block" "frontend_public_access" {
  bucket = aws_s3_bucket.frontend_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "frontend_distribution" {
  origin {
    domain_name = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
    origin_id   = "S3Origin"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  default_root_object = "index.html"
  
  # Handle SPA routing by redirecting 404s to index.html
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }
  
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3Origin"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# Security Group for Backend
resource "aws_security_group" "backend_sg" {
  name        = "suimon-backend-sg"
  description = "Security group for Suimon backend server"
  vpc_id      = aws_vpc.suimon_vpc.id

  # Allow inbound HTTP traffic
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP traffic"
  }

  # Allow inbound HTTPS traffic
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS traffic"
  }

  # Allow inbound Node.js server traffic
  ingress {
    from_port   = 3002
    to_port     = 3002
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow Node.js server traffic"
  }

  # Allow inbound SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow SSH access"
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "suimon-backend-sg"
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "suimon_logs" {
  name              = "/aws/suimon-game"
  retention_in_days = 14
}

# Outputs
output "backend_public_ip" {
  value = aws_instance.backend_server.public_ip
}

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.frontend_distribution.domain_name
}