# AWS Infrastructure Configuration

provider "aws" {
  region = "us-west-2"  # Change this to your preferred region
}

# Key Pair
resource "aws_key_pair" "backend_key" {
  key_name   = "suimon-backend-key"
  public_key = file("temp_key.pub")
}

# DynamoDB Tables
resource "aws_dynamodb_table" "players" {
  name           = "SuimonPlayers"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "playerId"

  attribute {
    name = "playerId"
    type = "S"
  }

  attribute {
    name = "wins"
    type = "N"
  }

  global_secondary_index {
    name               = "WinsIndex"
    hash_key           = "wins"
    projection_type    = "ALL"
  }
}

resource "aws_dynamodb_table" "games" {
  name           = "SuimonGames"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "gameId"
  range_key      = "startTime"

  attribute {
    name = "gameId"
    type = "S"
  }

  attribute {
    name = "startTime"
    type = "N"
  }

  attribute {
    name = "player1Id"
    type = "S"
  }

  global_secondary_index {
    name               = "PlayerGamesIndex"
    hash_key           = "player1Id"
    range_key          = "startTime"
    projection_type    = "ALL"
  }
}

# EC2 Instance
resource "aws_instance" "backend" {
  ami           = "ami-0735c191cf914754d"  # Amazon Linux 2 AMI
  instance_type = "t2.micro"
  key_name      = aws_key_pair.backend_key.key_name

  tags = {
    Name = "suimon-backend-server"
  }

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y nodejs npm git
              npm install -g pm2
              mkdir -p /home/ec2-user/suimon-game
              cd /home/ec2-user/suimon-game
              cat > .env << EOL
              PORT=3002
              AWS_REGION=us-west-2
              DYNAMODB_PLAYERS_TABLE=SuimonPlayers
              DYNAMODB_GAMES_TABLE=SuimonGames
              ALLOWED_ORIGINS=*
              NODE_ENV=production
              EOL
              chown -R ec2-user:ec2-user /home/ec2-user/suimon-game
              git clone https://github.com/bilal/suimon-simple-card-game.git .
              cd backend
              npm install
              pm2 delete suimon-backend || true
              pm2 start server.js --name "suimon-backend" --time
              pm2 startup
              pm2 save
              pm2 startup | grep -v PM2 | bash
              EOF

  vpc_security_group_ids = [aws_security_group.backend_sg.id]

  iam_instance_profile = aws_iam_instance_profile.backend_profile.name
}

# IAM Role and Instance Profile
resource "aws_iam_role" "backend_role" {
  name = "suimon-backend-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "dynamodb_access" {
  name = "dynamodb-access"
  role = aws_iam_role.backend_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.players.arn,
          aws_dynamodb_table.games.arn,
          "${aws_dynamodb_table.games.arn}/index/*",
          "${aws_dynamodb_table.players.arn}/index/*"
        ]
      }
    ]
  })
}

resource "aws_iam_instance_profile" "backend_profile" {
  name = "suimon-backend-profile"
  role = aws_iam_role.backend_role.name
}

# Security Group
resource "aws_security_group" "backend_sg" {
  name        = "suimon-backend-sg"
  description = "Security group for Suimon game backend"

  ingress {
    from_port   = 3002
    to_port     = 3002
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow WebSocket and HTTP connections"
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow SSH access"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "suimon-backend-sg"
    Environment = "production"
  }
}

# Output the public IP
output "backend_public_ip" {
  value = aws_instance.backend.public_ip
}