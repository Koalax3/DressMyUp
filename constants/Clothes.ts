import { ClothingSubType } from '../types';

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
    'skirt': 'Jupe'
  },
  'shoes': {
    'sneakers': 'Baskets',
    'boots': 'Bottes',
    'flats': 'Chaussures plates',
    'heels': 'Talons',
    'sandals': 'Sandales'
  },
  'accessory': {
    'hat': 'Chapeau',
    'scarf': 'Écharpe',
    'belt': 'Ceinture',
    'bag': 'Sac',
    'socks': 'Chaussettes',
    'jewelry': 'Bijoux',
    'watch': 'Montre',
    'glasses': 'Lunettes'
  },
  'ensemble': {
    'dress': 'Robe',
    'jumpsuit': 'Combinaison',
    'suit': 'Costume'
  }
};
