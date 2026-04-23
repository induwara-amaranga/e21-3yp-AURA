const imageModules = import.meta.glob('../assets/food_images/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
});

const menuImageByFilename = Object.entries(imageModules).reduce((acc, [path, src]) => {
  const filename = path.split('/').pop();
  if (filename) acc[filename] = src;
  return acc;
}, {});

export const AVAILABLE_MENU_IMAGES = Object.keys(menuImageByFilename).sort((a, b) =>
  a.localeCompare(b)
);

export const DEFAULT_MENU_IMAGE_FILENAME = 'Truffle Wagyu Burger.jpg';

const fallbackImageSrc =
  menuImageByFilename[DEFAULT_MENU_IMAGE_FILENAME] ||
  menuImageByFilename[AVAILABLE_MENU_IMAGES[0]] ||
  '';

export function getMenuImageSrc(imageFilename) {
  if (!imageFilename) return fallbackImageSrc;
  return menuImageByFilename[imageFilename] || fallbackImageSrc;
}

export function isKnownMenuImage(imageFilename) {
  return Boolean(imageFilename && menuImageByFilename[imageFilename]);
}
