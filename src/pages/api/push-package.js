import JSZip from "jszip";
import {readFile} from 'fs/promises'

const handler = async (req, res) => {
    var zip = new JSZip();
    const websiteJson = await readFile('./pushPackage.raw/website.json', 'utf8');
    zip.file("website.json", websiteJson);
    var img = zip.folder("icon.iconset");
    const iconsSizes = [16,32,128];
    iconsSizes.forEach(async (icon) => {
        const imx1Name = `icon_${icon}x${icon}.png`;
        const imx1 = await readFile(`./pushPackage.raw/icon.iconset/${imx1Name}`, 'base64');
        img.file(imx1Name, imx1, {base64: true});
        const imx2Name = `icon_${icon}x${icon}@2.png`;
        const imx2 = await readFile(`./pushPackage.raw/icon.iconset/${imx2Name}`, 'base64');
        img.file(imx2Name, imx2, {base64: true});
    });
    
    zip.generateAsync({type:"blob"})
    .then(function(content) {
        res.setHeader('Content-disposition', 'attachment; filename=pushPackage.raw.zip');
        res.setHeader('Content-Type', 'application/zip');
        res.status(200).send(content);
    }).catch((err) => {
        res.status(401).json({
            error: err
        })
    });
};

export default handler;