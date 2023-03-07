import JSZip from "jszip";
import fs,{ readFileSync, writeFileSync } from 'fs';
import path from 'path';
const { promisify } = require('util');
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
    console.log("🚀 ~ file: push-package.js:43 ~ createManifest ~ manifestData:", manifestData)
    return JSON.stringify(manifestData);
    
}

// Creates a signature of the manifest using the push notification certificate.
// function create_signature($package_dir, $cert_path, $cert_password) {
//     // Load the push notification certificate
//     $pkcs12 = file_get_contents($cert_path);
//     $certs = array();
//     if(!openssl_pkcs12_read($pkcs12, $certs, $cert_password)) {
//         return;
//     }

//     $signature_path = "$package_dir/signature";

//     // Sign the manifest.json file with the private key from the certificate
//     $cert_data = openssl_x509_read($certs['cert']);
//     $private_key = openssl_pkey_get_private($certs['pkey'], $cert_password);
//     openssl_pkcs7_sign("$package_dir/manifest.json", $signature_path, $cert_data, $private_key, array(), PKCS7_BINARY | PKCS7_DETACHED);

//     // Convert the signature from PEM to DER
//     $signature_pem = file_get_contents($signature_path);
//     $matches = array();
//     if (!preg_match('~Content-Disposition:[^\n]+\s*?([A-Za-z0-9+=/\r\n]+)\s*?-----~', $signature_pem, $matches)) {
//         return;
//     }
//     $signature_der = base64_decode($matches[1]);
//     file_put_contents($signature_path, $signature_der);
// }

// Creates a signature of the manifest using the push notification certificate.
function createSignature(packageDir, certPath, certPassword, manifestJson) {
    // Load the push notification certificate
    
    const pkcs12 = fs.readFileSync(certPath,'binary');
    // console.log("🚀 ~ file: push-package.js:77 ~ createSignature ~ certPath:", certPath)
    const p12Asn1 = forge.asn1.fromDer(pkcs12);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, certPassword);
    const cert = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag][0].cert;
    const privateKey = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag][0].key;
    // console.log("🚀 ~ file: push-package.js:83 ~ createSignature ~ key:", privateKey)

    const signaturePath = `${packageDir}/signature`;
    let messageDigest = forge.md.sha256.create();

    messageDigest.update(manifestJson, 'utf8');

    const signature = forge.util.encode64(privateKey.sign(messageDigest));
    
    // Sign the manifest.json file with the private key from the certificate
    // const manifestJson = fs.readFileSync(`${packageDir}manifest.json`, 'utf8');
    // const p7 = forge.pkcs7.createSignedData();
    // p7.content = forge.util.createBuffer(manifestJson);
    // p7.addCertificate(cert);
    // p7.addSigner({
    //     key,
    //     certificate: cert,
    //     digestAlgorithm: forge.pki.oids.sha256
    // });
    // p7.sign({ detached: true });
    // console.log("🚀 ~ file: push-package.js:97 ~ createSignature ~ p7:", p7)

    // const match = p7.match(/Content-Disposition:[^\n]+\s*?([A-Za-z0-9+=/\r\n]+)\s*?-----/);
    // console.log("🚀 ~ file: push-package.js:100 ~ createSignature ~ match:", match)
    // if (!match) {
    //     throw new Error('Could not extract signature from PEM file.');
    // }
//     const signatureDer = Buffer.from(match[1], 'base64');

    // Write the signature to the file system
    // const signatureDer = forge.asn1.toDer(p7.toAsn1());
    // console.log("🚀 ~ file: push-package.js:70 ~ createSignature ~ signatureDer:", signatureDer)
    
    return {signaturePath: signaturePath , signature: signature};
  }
// function createSignature(packageDir, certPath, certPassword, manifestData) {
//     // Load the push notification certificate
//     const pkcs12 = fs.readFileSync(certPath);

//     const keyBase64 = pkcs12.toString('base64');
//     const pkcs12Der = forge.util.decode64(keyBase64);
//     const pkcs12Asn1 = forge.asn1.fromDer(pkcs12Der);
//     const pk12 = forge.pkcs12.pkcs12FromAsn1(pkcs12Asn1, certPassword);

//     const certs = pk12.getBags({bagType: forge.pki.oids.pkcs8ShroudedCertBag});
//     const cert = certs[forge.pki.oids.pkcs8ShroudedCertBag][0];

//     const bags = pk12.getBags({bagType: forge.pki.oids.pkcs8ShroudedKeyBag});
//     const bag = bags[forge.pki.oids.pkcs8ShroudedKeyBag][0];
    
//     const privateKey = bag.key;

//     //return signature(manifestData, cert, privateKey)

//     let messageDigest = forge.md.sha256.create();
    
//     console.log('bag',bag);

//     messageDigest.update(manifestData, 'utf8');

//     const signature = forge.util.encode64(privateKey.sign(messageDigest));
    
//     return signature;
    

//     // Convert the signature from PEM to DER
//     const signaturePem = signature.toString('ascii');
    
//     const match = signaturePem.match(/Content-Disposition:[^\n]+\s*?([A-Za-z0-9+=/\r\n]+)\s*?-----/);
//     if (!match) {
//         throw new Error('Could not extract signature from PEM file.');
//     }
//     const signatureDer = Buffer.from(match[1], 'base64');
//     return {der:signatureDer, path:signaturePath};
//     // fs.writeFileSync(signaturePath, signatureDer);
// }

const handler = async (req, res) => {
    var zip = new JSZip();
    const websiteJson = readFileSync('./public/pushPackage.raw/website.json', 'utf8');
    
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
    // console.log("🚀 ~ file: push-package.js:134 ~ handler ~ createManifest:", manifest)
    zip.file('manifest.json', manifest);
    const signed = createSignature('./public/pushPackage.raw/', certificatePath, password, manifest);
    // console.log("🚀 ~ file: push-package.js:137 ~ handler ~ signed:", signed)
    const {signature, signaturePath} = signed;
    zip.file('signature', signature);
    // const signatureBuf = new Buffer.from(signature.toString())
    // console.log("🚀 ~ file: push-package.js:167 ~ handler ~ signatureDer:", typeof signatureBuf)
    // fs.writeFileSync(signaturePath, signature, 'base64');
    // console.log("🚀 ~ file: push-package.js:137 ~ handler ~ signatureDer, signaturePath:", signatureDer, signaturePath)
    
    const content = await zip.generateAsync({ type: 'nodebuffer' })
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