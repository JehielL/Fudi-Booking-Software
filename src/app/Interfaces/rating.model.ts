import { Menu } from "./menu.model";
import { User } from "./user.model";

export interface RatingImage {
    id: number;
    imagePath: string;
    imageOrder: number;
}

export interface Rating {
    id: number;
    score: number;
    comment: string;
    likesCount: number;
    user?: User;
    menu?: Menu;
    images?: RatingImage[];
}

export interface LikeResponse {
    message: string;
    liked: boolean;
    likesCount: number;
}