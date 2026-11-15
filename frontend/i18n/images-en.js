// Presentation translations: IDs, source records and scientific files remain unchanged.
const rows = [
['blue-marble-2002','Blue Marble 2002: Western Hemisphere','Earth with the Americas at the center, blue oceans and white clouds against a black background. NASA created this natural-color composite from four months of MODIS observations aboard Terra. Explore the contrasts between ocean, land, clouds and space.'],
['hubble-cats-head',"Cat’s Head Nebula",'A dark, elongated dust pillar rises between blue, yellow and orange clouds. A glowing edge and a reddish point stand out near its upper tip. Hubble shows this structure within the Carina Nebula.'],
['hubble-ngc-1827','NGC 1827: an edge-on galaxy','An inclined galactic strip crosses a black background. Brown dust lanes cut through its bright center and bluish regions. Stars and distant galaxies surround this Hubble view.'],
['hubble-ngc-4449','NGC 4449: a dwarf galaxy','An irregular galactic cloud fills the center, with many blue points and pink patches among light and dark regions. Hubble captured this view of dwarf galaxy NGC 4449.'],
['hubble-n44','N44: a stellar superbubble','A large dark cavity surrounded by blue gas and glowing filaments contains numerous stars. N44 lies in the Large Magellanic Cloud. Stellar winds and supernovae have helped shape its cavity.'],
['hubble-ngc-4654','NGC 4654: an asymmetric spiral','An inclined galaxy has uneven arms, bluish regions and small pink patches around a bright center. Dark lanes cross its disk. Hubble reveals its asymmetric structure.'],
['hubble-lh95','LH 95: stars among crimson clouds','White and blue stars stand out against a broad red cloud crossed by dark filaments. LH 95 is a star-forming region in the Large Magellanic Cloud observed by Hubble.'],
['hubble-ngc-6723','NGC 6723: the Chandelier Cluster','Thousands of white, blue and golden points become denser toward the center and fill the frame. Hubble portrays globular cluster NGC 6723, also called the Chandelier Cluster.'],
['hubble-eso-490-017','ESO 490-017: a faint galaxy','A diffuse gathering of faint stars appears behind bright foreground stars with diffraction spikes. Small orange and reddish galaxies dot the black background. The central object is irregular galaxy ESO 490-017.'],
['hubble-ngc-1266','NGC 1266: a galaxy in transition','An oval halo surrounds a bright core crossed by reddish dust patches. No clear spiral arms are visible. This Hubble image shows lenticular galaxy NGC 1266.'],
['hubble-ngc-3137','NGC 3137: a starry spiral','A tilted galaxy crosses the scene with a bright center, dark lanes and groups of blue and pink points in its disk. Hubble observed this spiral galaxy, NGC 3137.'],
['hubble-trifid','Trifid Nebula','A thick ridge of dark dust stands against blue gas above and golden tones to the right. Small stars and glowing edges appear among the clouds. Hubble captured this view using its Wide Field Camera 3.'],
['hubble-crab-1999','Crab Nebula: 1999 observation','Pink, purple and orange filaments surround a bright blue central region against black space. This 1999 Hubble image shows the Crab Nebula, the remnant of a supernova.'],
['hubble-cats-eye',"Cat’s Eye Nebula: Hubble detail",'Curved layers of blue and white gas form an oval around a central point, surrounded by reddish arcs against black space. This file shows Hubble’s detailed view of NGC 6543 from an article comparing Hubble and Euclid observations.'],
['iss-lightning','Lightning observed from the ISS','A gray globe centered on the Americas shows yellow points concentrated over several continental regions and geographic reference lines. This is the Science On a Sphere thumbnail of a visualization of lightning detected by the ISS Lightning Imaging Sensor. This still image does not reproduce the video’s changes over time.'],
['hubble-egg-nebula','Egg Nebula','Two beams of light spread on opposite sides of a dark central band, among soft arcs and stars against black space. Hubble observes gas and dust expelled by a star late in its evolution.'],
['hubble-ngc-5335','NGC 5335: a barred spiral','A golden bar crosses the bright core of a nearly face-on galaxy. Blue regions and dark filaments surround it without clearly defined arms. This is spiral galaxy NGC 5335.'],
['hubble-ngc-1961','NGC 1961: a peculiar spiral','A yellowish core and dark dust lanes dominate a galaxy with uneven arms and blue regions near its edges. Hubble shows NGC 1961, also cataloged as Arp 184.'],
['hubble-orion-protostar','Star formation in Orion','Brown and golden clouds form a cavity around bright points, with beams and dark ridges. This file belongs to Hubble’s series of observations of protostars in the Orion Molecular Cloud complex.'],
['hubble-hh80-81','HH 80/81: jets from a forming star','Bright pink and green patches line up diagonally across a dark star field. These regions of gas in HH 80/81 glow because of shocks associated with material expelled by a forming star.'],
];
export const englishImages = Object.fromEntries(rows.map(([id,title,description])=>[id,{title,description,altText:description.split('. ')[0]+'.'}]));
export function localizeImage(image) {
  const text = englishImages[image.id];
  return text ? { ...image, ...text } : image;
}
