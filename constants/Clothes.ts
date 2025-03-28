import { ClothingSubType } from '../types';

export const BRANDS = [
  'LVMH', 'Nike', 'Dior', 'Inditex', 'TJX Companies', 'Kering', 'Fast Retailing',
  'Lululemon athletica', 'Cintas', 'Ross Stores', 'Adidas', 'H&M', 'Moncler',
  'Prada', 'Burlington Stores', 'Burberry', 'Next PLC', 'Zalando', 'JD Sports Fashion',
  'Tapestry', 'Balmain', '3.1 Phillip Lim', '7 For All Mankind', 'AllSaints',
  'Alo Yoga', 'American Eagle Outfitters', 'Calvin Klein', 'Carhartt', 'Chanel',
  'Hermès', 'Gucci', 'Versace', 'Dolce & Gabbana', 'Givenchy', 'Valentino',
  'Ralph Lauren', 'Tom Ford', 'Alexander McQueen', 'Fendi', 'Saint Laurent',
  'Bottega Veneta', 'Celine', 'Tiffany & Co.', 'Sephora', 'Lacoste', 
  'Polo Ralph Lauren', 'New Balance', 'Swarovski', 'Diesel', 'Forever 21', 
  'GAP', 'Levis', 'Patagonia', 'Under Armour', 'Nordstrom', 'TJ Maxx', 
  'Skechers', 'Aldo', 'Jimmy Choo', 'Elie Saab', 'Longchamp', 'Tommy Hilfiger', 
  'Tory Burch', 'Chow Tai Fook', 'Manolo Blahnik', 'Fossil', 'Swatch', 
  'Banana Republic', 'Desigual', 'G-star', 'Topshop', 'Oakley', 'Cole Haan', 
  'Lao Feng Xiang', 'Longines', 'Chopard', 'Christian Louboutin', 'Patek Philippe', 
  'Tag Heuer', 'Breguet', 'ESCADA', 'Audemars Piguet', 'Vacheron Constantin', 
  'Tissot', 'Furla', 'Stuart Weitzman', 'Jaeger-Le Coultre', 'Elie Taharie',
  'Louis Vuitton', 'Zara', 'Uniqlo', 'Cartier', 'Rolex', 'Coach', 'The North Face',
  'Victoria\'s Secret', 'Michael Kors', 'C&A', 'Net-a-Porter', 'Sisley', 'TOD\'s',
  'Bogner', 'New Look', 'Armani', 'Balenciaga', 'Hugo Boss', 'Asics', 'D&G',
  'Pepe Jeans', 'Momotarō'
]

export const COLORS = [
  { id: 'black', name: 'Noir', value: '#000000' },
  { id: 'gray', name: 'Gris', value: '#808080' },
  { id: 'blue', name: 'Bleu', value: '#0000FF' },
  { id: 'white', name: 'Blanc', value: '#FFFFFF' },
  { id: 'red', name: 'Rouge', value: '#FF0000' },
  { id: 'beige', name: 'Beige', value: '#F5F5DC' },
  { id: 'green', name: 'Vert', value: '#00FF00' },
  { id: 'violet', name: 'Violet', value: '#800080' },
  { id: 'yellow', name: 'Jaune', value: '#FFFF00' },
  { id: 'brown', name: 'Marron', value: '#A52A2A' },
  { id: 'pink', name: 'Rose', value: '#FFC0CB' },
  { id: 'orange', name: 'Orange', value: '#FFA500' },
  { id: 'gold', name: 'Doré', value: '#FFD700' },
  { id: 'silver', name: 'Argenté', value: '#C0C0C0' },
  { id: 'multicolor', name: 'Multicolore', value: 'linear-gradient' },
];

export const fits: { [key: string]: string } = {
    'slim': 'Slim',
    'regular': 'Regular',
    'loose': 'Loose',
    'oversize': 'Oversize'
  };

  export const types: { [key: string]: string } = {
    'top': 'Haut',
    'bottom': 'Bas',
    'shoes': 'Chaussures',
    'accessory': 'Accessoire',
    'ensemble': 'Ensemble'
  };

export const subtypesByType: { [key: string]: { [key in ClothingSubType]?: string } } = {
  'top': {
    'tshirt': 'T-shirt',
    'polo': 'Polo',
    'shirt': 'Chemise',
    'sweater': 'Pull',
    'sweatshirt': 'Sweat',
    'jacket': 'Veste',
    'coat': 'Manteau',
    'blazer': 'Blazer'
  },
  'bottom': {
    'jeans': 'Jean',
    'pants': 'Pantalon',
    'shorts': 'Short',
    'skirt': 'Jupe',
    'sweatpants': 'Jogging',
  },
  'shoes': {
    'sneakers': 'Baskets',
    'boots': 'Bottes',
    'flats': 'Tennis',
    'heels': 'Talons',
    'dress_shoes': 'Chaussures de ville',
    'sandals': 'Sandales',
    'mocassin': 'Mocassin',
    'hoof': 'Sabot',
    'slipper': 'Chaussons',
  },
  'accessory': {
    'hat': 'Chapeau',
    'scarf': 'Écharpe',
    'belt': 'Ceinture',
    'bag': 'Sac',
    'socks': 'Chaussettes',
    'jewelry': 'Bijoux',
    'watch': 'Montre',
    'glasses': 'Lunettes',
    'nylon': 'Collants'
  },
  'ensemble': {
    'dress': 'Robe',
    'jumpsuit': 'Combinaison',
    'suit': 'Costume',
    'overalls': 'Salopette'
  }
};

export const PATTERNS = {
  cashmere: 'Cachemire',
  camouflage: 'Camouflage',
  plaid_and_tartan: 'Carreaux et tartan',
  ombre: 'Ombre',
  floral: 'Fleuri',
  animal_print: 'Imprimé animal',
  graphics_and_logos: 'Graphismes et logos',
  houndstooth: 'Pied-de-poule',
  polka_dots: 'Pois',
  stripes: 'Rayures',
  tie_dye: 'Tie-dye',
  plain: 'Uni',
  zig_zag: 'Zig-zag'
} as const;

export type Pattern = typeof PATTERNS[keyof typeof PATTERNS];