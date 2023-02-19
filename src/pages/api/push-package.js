import JSZip from "jszip";
import fs, { readFileSync } from 'fs';
import path from 'path';
import crypto from 'crypto'; 
import forge from 'node-forge';


//DO NOT DELETE THIS LINE #2A9iu5u!E@3M

const password = '2A9iu5u!E@3M';
const certificatePath = './public/certs/Certificates.p12';
const intermediatePemPath = './public/certs/intermediate.pem';
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

function signature(manifestData, certOrCertPem, privateKeyAssociatedWithCert)
{
    //A. load the WWWDC cert, always the same
    var intermediateBinnary = fs.readFileSync(intermediatePemPath, 'utf8')
    //console.log('pem wwwdc ', intermediateBinnary);
    //B. continue signing
    var p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(manifestData, 'utf8');
    p7.addCertificate(certOrCertPem);
    p7.addSigner({
        key: privateKeyAssociatedWithCert,
        certificate: certOrCertPem,
        digestAlgorithm: forge.pki.oids.sha256
    });
    p7.addCertificate(intermediateBinnary);
    p7.sign({detached: true});
    //console.log('p7: ',p7)

    var pem = forge.pkcs7.messageToPem(p7);
    console.log('pem: ',pem)

    // var lines = pem.split('\n')
    // console.log('lines ',lines);

    // We need to turn into DER according to Apple (sure there are better ways tho)
    var preDer = pem.replace('-----BEGIN PKCS7-----\r\n','');
    preDer = preDer.replace('\r\n-----END PKCS7-----','');
    //console.log('-+pem: ',preDer)

    // var lines = preDer.split('\n')
    // console.log('lines ',lines);

    return preDer;
}

function createSignature(packageDir, certPath, certPassword, manifestData) {
    const pkcs12 = fs.readFileSync(certPath);

    const keyBase64 = pkcs12.toString('base64');
    const pkcs12Der = forge.util.decode64(keyBase64);
    const pkcs12Asn1 = forge.asn1.fromDer(pkcs12Der);
    const pk12 = forge.pkcs12.pkcs12FromAsn1(pkcs12Asn1, certPassword);

    const certs = pk12.getBags({bagType: forge.pki.oids.pkcs8ShroudedCertBag});
    const cert = certs[forge.pki.oids.pkcs8ShroudedCertBag][0].cert;

    const bags = pk12.getBags({bagType: forge.pki.oids.pkcs8ShroudedKeyBag});
    const bag = bags[forge.pki.oids.pkcs8ShroudedKeyBag][0];
    
    const privateKey = bag.key;

    return signature(manifestData, cert, privateKey)

    
}

const handler = async (req, res) => {
    var zip = new JSZip();
    const websiteJson = readFileSync('./public/pushPackage.raw/website.json', 'utf8');
    
    console.log('test',req.headers);

    zip.file("website.json", websiteJson);
    var img = zip.folder("icon.iconset");
    const iconsSizes = [16,32,128];
    iconsSizes.forEach( (icon) => {
        const imx1Name = `icon_${icon}x${icon}.png`;
        const imx1 = readFileSync(`./public/pushPackage.raw/icon.iconset/${imx1Name}`, 'base64');
        img.file(imx1Name, imx1, {base64: true});
        const imx2Name = `icon_${icon}x${icon}@2x.png`;
        const imx2 = readFileSync(`./public/pushPackage.raw/icon.iconset/${imx2Name}`, 'base64');
        img.file(imx2Name, imx2, {base64: true});
    });

    const manifest = createManifest('./public/pushPackage.raw/', 2);
    
    //console.log('manifest.json', manifest);
    
    zip.file('manifest.json', manifest);
   
    const signature = createSignature('./public/pushPackage.raw/', certificatePath, password, manifest);
    
    console.log('signature:',signature);
   
    zip.file('signature', signature);

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