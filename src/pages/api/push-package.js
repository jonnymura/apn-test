import JSZip from "jszip";
import { readFileSync } from 'fs';

function rawFiles() {
    return [
        'icon.iconset/icon_16x16.png',
        'icon.iconset/icon_16x16@2x.png',
        'icon.iconset/icon_32x32.png',
        'icon.iconset/icon_32x32@2x.png',
        'icon.iconset/icon_128x128.png',
        'icon.iconset/icon_128x128@2x.png',
        'website.json'
    ];
}

function createManifest(packageDir, packageVersion) {
    // Obtain hashes of all the files in the push package
    const manifestData = {};
    for (let rawFile of rawFiles()) {
        const fileContents = fs.readFileSync(path.join(packageDir, rawFile));
        if (packageVersion === 1) {
            manifestData[rawFile] = crypto.createHash('sha1').update(fileContents).digest('hex');
        } else if (packageVersion === 2) {
            const hashType = 'sha512';
            manifestData[rawFile] = {
                hashType: hashType,
                hashValue: crypto.createHash(hashType).update(fileContents).digest('base64'),
            };
        } else {
            throw new Error('Invalid push package version.');
        }
    }
    return manifestData;
    // fs.writeFileSync(path.join(packageDir, 'manifest.json'), JSON.stringify(manifestData));
}

const handler = async (req, res) => {
    var zip = new JSZip();
    const websiteJson = readFileSync('./public/pushPackage.raw/website.json', 'utf8');
    
    zip.file("website.json", websiteJson);
    var img = zip.folder("icon.iconset");
    const iconsSizes = [16,32,128];
    await iconsSizes.forEach(async (icon) => {
        const imx1Name = `icon_${icon}x${icon}.png`;
        const imx1 = readFileSync(`./public/pushPackage.raw/icon.iconset/${imx1Name}`, 'base64');
        img.file(imx1Name, imx1, {base64: true});
        const imx2Name = `icon_${icon}x${icon}@2x.png`;
        const imx2 = readFileSync(`./public/pushPackage.raw/icon.iconset/${imx2Name}`, 'base64');
        img.file(imx2Name, imx2, {base64: true});
    });
    const manifest = createManifest('./public/pushPackage.raw/', 2);
    zip.file('manifest.json', JSON.stringify(manifest));
    const content = await zip.generateAsync({ type: 'nodebuffer' })
    // .then(function(content) {
        res.setHeader('Content-disposition', 'attachment; filename=pushPackage.raw.zip');
        res.setHeader('Content-Type', 'application/zip');
        res.status(200).send(content);
    // }).catch((err) => {
    //     res.status(401).json({
    //         error: err
    //     })
    // });
};

export default handler;