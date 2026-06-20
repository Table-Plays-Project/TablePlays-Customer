import { ImageSourcePropType } from 'react-native';

export type AvatarOption = {
  id: string;
  source: ImageSourcePropType;
};

const AVATARS: AvatarOption[] = [
  { id: 'woman1', source: require('@/assets/images/womenavator.png') },
  { id: 'man1', source: require('@/assets/images/manavator.png') },
  { id: 'woman2', source: require('@/assets/images/womenavator2.png') },
  { id: 'man2', source: require('@/assets/images/manavator2.png') },
  { id: 'woman3', source: require('@/assets/images/womenavator3.png') },
  { id: 'man3', source: require('@/assets/images/manavator3.png') },
  { id: 'woman4', source: require('@/assets/images/womenavator4.png') },
  { id: 'man4', source: require('@/assets/images/manavator4.png') },
  { id: 'woman5', source: require('@/assets/images/womenavator5.png') },
  { id: 'man5', source: require('@/assets/images/manavator5.png') },
];

export function getAvatarById(id: string): AvatarOption | undefined {
  return AVATARS.find((a) => a.id === id);
}

export default AVATARS;
