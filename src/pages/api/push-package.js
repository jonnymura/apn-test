import JSZip from "jszip";
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import forge from 'node-forge';
//DO NOT DELETE THIS LINE #2A9iu5u!E@3M

const password = '2A9iu5u!E@3M';
const certificatePath = './public/certs/Certificates.p12';
forge.options.usePureJavaScript = true;

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
        const fileContents = readFileSync(path.join(packageDir, rawFile));
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
    return JSON.stringify(manifestData);
}

// Creates a signature of the manifest using the push notification certificate.
function createSignature(packageDir, certPath, certPassword, manifestData) {
    // Load the push notification certificate
    const pkcs12 = readFileSync(certPath, 'binary');
    
    // const certs = crypto.pkcs12.parse(pkcs12, certPassword);
    // const certs = forge.pkcs12.
    var p12Asn1 = forge.asn1.fromDer(pkcs12);
    var p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, certPassword);
    
    
    var certs = p12.getBags({bagType: forge.pki.oids.certBag});
    var cert = certs[forge.pki.oids.certBag][0];
    var keys = p12.getBags({bagType: forge.pki.oids.keyBag});
    var key = keys[forge.pki.oids.keyBag];
    // console.log("🚀 ~ file: push-package.js:53 ~ createSignature ~ p12", bag)
    // writeFileSync('./cert.txt',JSON.stringify(bag, 0, 4))
    console.log("🚀 ~ file: push-package.js:53 ~ createSignature ~ p12", bag, cert)
    writeFileSync('./key.txt',JSON.stringify(bag, 0, 4))
    // console.log("🚀 ~ file: push-package.js:55 ~ createSignature ~ bag", bag)
    // console.log("🚀 ~ file: push-package.js:54 ~ createSignature ~ certs", certs)

    
    const signaturePath = path.join(pkcs12, 'signature');

    // Sign the manifest.json file with the private key from the certificate
    const certData = cert;
    const privateKey = key;

    const sign = crypto.createSign('RSA-SHA512');
    // const manifestData = fs.readFileSync(path.join(packageDir, 'manifest.json'));
    sign.update(manifestData);
    const signature = sign.sign({ key: privateKey, passphrase: certPassword });

    // Convert the signature from PEM to DER
    const signaturePem = signature.toString('ascii');
    const match = signaturePem.match(/Content-Disposition:[^\n]+\s*?([A-Za-z0-9+=/\r\n]+)\s*?-----/);
    if (!match) {
        throw new Error('Could not extract signature from PEM file.');
    }
    const signatureDer = Buffer.from(match[1], 'base64');
    return {der:signatureDer, path:signaturePath};
    // fs.writeFileSync(signaturePath, signatureDer);
}

const handler = async (req, res) => {
    var zip = new JSZip();
    const websiteJson = readFileSync('./public/pushPackage.raw/website.json', 'utf8');
    
    zip.file("website.json", websiteJson);
    var img = zip.folder("icon.iconset");
    const iconsSizes = [16,32,128];
    await iconsSizes.forEach( (icon) => {
        const imx1Name = `icon_${icon}x${icon}.png`;
        const imx1 = readFileSync(`./public/pushPackage.raw/icon.iconset/${imx1Name}`, 'base64');
        img.file(imx1Name, imx1, {base64: true});
        const imx2Name = `icon_${icon}x${icon}@2x.png`;
        const imx2 = readFileSync(`./public/pushPackage.raw/icon.iconset/${imx2Name}`, 'base64');
        img.file(imx2Name, imx2, {base64: true});
    });
    const manifest = createManifest('./public/pushPackage.raw/', 2);
    zip.file('manifest.json', manifest);
    // const signed = createSignature('./public/pushPackage.raw/', certificatePath, password, manifest);
    // console.log('signed:',signed);
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