import { User } from 'src/user/entities/user.entity';

export interface RequestWithUser extends Request {
  user: User;
}

export interface UserPaginationResponse {
  users: User[];
  totalCount: number;
}
