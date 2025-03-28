import { Pattern } from '@/constants/Clothes';

export type User = {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
};

export type ClothingType = 'top' | 'bottom' | 'shoes' | 'accessory' | 'ensemble';

export type ClothingSubType = 
  | 'tshirt' | 'polo' | 'shirt' | 'sweater' | 'sweatshirt' | 'jacket' | 'coat' | 'blazer'  // top
  | 'jeans' | 'pants' | 'shorts' | 'skirt' | 'sweatpants'   // bottom
  | 'sneakers' | 'boots' | 'flats' | 'heels' | 'sandals' | 'mocassin' | 'hoof' | 'slipper' | 'dress_shoes'  // shoes
  | 'hat' | 'scarf' | 'belt' | 'bag' | 'socks' | 'jewelry' | 'watch' | 'glasses' | 'nylon' // accessory
  | 'dress' | 'jumpsuit' | 'suit' | 'overalls';  // ensemble

export type ClothingItem = {
  id: string;
  user_id: string;
  name: string;
  type: ClothingType;
  subtype: ClothingSubType;
  brand?: string;
  color: string;
  fit?: 'slim' | 'regular' | 'loose' | 'oversize';
  pattern: Pattern | null;
  material?: string;
  image_url: string;
  created_at: string;
  clothe?: ClothingItem;
};

export type Outfit = {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  image_url?: string;
  season?: 'spring' | 'summer' | 'fall' | 'winter' | 'all';
  occasion?: 'casual' | 'formal' | 'sport' | 'party' | 'work';
  isPublic?: boolean;
  gender?: 'male' | 'female' | 'unisex';
  created_at: string;
  user: User;
  likes?: Like[]; 
  clothes?: (ClothingItem & { clothe?: ClothingItem })[];
};

export type ClothesOutfit = {
  id: string;
  outfit_id: string;
  clothe_id: string;
  created_at: string;
};

export type Comment = {
  id: string;
  user_id: string;
  outfit_id: string;
  content: string;
  created_at: string;
  user?: User;
};

export type Like = {
  id: string;
  user_id: string;
  outfit_id: string;
  created_at: string;
};

export type Follow = {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}; 