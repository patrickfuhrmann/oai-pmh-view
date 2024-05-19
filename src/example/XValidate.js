const fs = require('fs');
const libxmljs = require('libxmljs');

// Load the XML file
const xmlString = fs.readFileSync('e.xml', 'utf8');
// Load the XSD file
const xsdString = fs.readFileSync('e.xsd', 'utf8');

// Parse the XML and XSD
const xmlDoc = libxmljs.parseXml(xmlString);
const xsdDoc = libxmljs.parseXml(xsdString);

// Validate the XML against the XSD
const isValid = xmlDoc.validate(xsdDoc);

if (isValid) {
    console.log('The XML file is valid.');
} else {
    console.log('The XML file is not valid.');
    console.log(xmlDoc.validationErrors);
}
