import JSZip from "jszip";
import { readFileSync } from 'fs';





const handler = async (req, res) => {
    var zip = new JSZip();
    // const websiteJson = await readFile(join(__dirname,'pushPackage.raw/website.json'), 'utf8');
    console.log("About to copy json")
    const websiteJson = readFileSync('./public/pushPackage.raw/website.json', 'utf8');
    console.log("🚀 ~ file: push-package.js:14 ~ handler ~ websiteJson", websiteJson)
    zip.file("website.json", websiteJson);
    var img = zip.folder("icon.iconset");
    const iconsSizes = [16,32,128];
    console.log("About to copy images")
    await iconsSizes.forEach(async (icon) => {
        const imx1Name = `icon_${icon}x${icon}.png`;
        const imx1 = readFileSync(`./public/pushPackage.raw/icon.iconset/${imx1Name}`, 'base64');
        img.file(imx1Name, imx1, {base64: true});
        console.log(`${imx1Name} copied!`)
        const imx2Name = `icon_${icon}x${icon}@2x.png`;
        const imx2 = readFileSync(`./public/pushPackage.raw/icon.iconset/${imx2Name}`, 'base64');
        img.file(imx2Name, imx2, {base64: true});
        console.log(`${imx2Name} copied!`)
    });
    console.log("Copied images")
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