import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';

export enum ReactionType {
  LIKE = 'like',
  DISLIKE = 'dislike',
  NONE = 'none'
}

export class RatingReactionDto {
  @IsUUID('4', { message: 'Invalid rating ID format' })
  @IsNotEmpty({ message: 'Rating ID is required' })
  ratingId: string;

  @IsEnum(ReactionType, { message: 'Invalid reaction type' })
  @IsNotEmpty({ message: 'Reaction type is required' })
  reaction: ReactionType;
}

export class RatingReactionResponseDto {
  ratingId: string;
  likes: number;
  dislikes: number;
  userReaction: ReactionType | null;

  constructor(ratingId: string, likes: number, dislikes: number, userReaction: ReactionType | null) {
    this.ratingId = ratingId;
    this.likes = likes;
    this.dislikes = dislikes;
    this.userReaction = userReaction;
  }
}
