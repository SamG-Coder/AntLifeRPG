import { Color } from "three/webgpu";
const nightSky = new Color(0x14212b),
  daySky = new Color(0x617364),
  dawnLight = new Color(0xffb977),
  dayLight = new Color(0xffe9c1),
  moonLight = new Color(0x869dbb);
export function daylightAt(minutes) {
  return Math.max(0, Math.sin((minutes / 1440) * Math.PI * 2 - Math.PI / 2));
}
export function updateDaylight(scene, sun, ambient, minutes) {
  const daylight = daylightAt(minutes);
  sun.intensity = 0.1 + daylight * 3.8;
  sun.color.copy(daylight > 0.001 ? dawnLight : moonLight);
  if (daylight > 0.001) sun.color.lerp(dayLight, Math.sqrt(daylight));
  ambient.intensity = 0.55 + daylight * 0.65;
  scene.environmentIntensity = 0.13 + daylight * 0.1;
  scene.background.copy(nightSky).lerp(daySky, daylight);
  scene.fog.color.copy(scene.background);
  const angle = (minutes / 1440) * Math.PI * 2;
  sun.position.set(
    20 * Math.cos(angle),
    5 + 22 * daylight,
    -13 + 15 * Math.sin(angle),
  );
}
