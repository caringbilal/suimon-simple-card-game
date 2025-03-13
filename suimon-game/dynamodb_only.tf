resource "aws_dynamodb_table" "suimon_players" {
  name           = "SuimonPlayers"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "playerId"

  attribute {
    name = "playerId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "suimon_games" {
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