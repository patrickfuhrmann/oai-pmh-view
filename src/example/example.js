const { JSDOM } = require("jsdom");
const punycode = require('punycode');
const fs = require('fs');

const xmlString = `
<catalog>
    <book id="bk101">
        <author>Gambardella, Matthew</author>
        <title>XML Developer's Guide</title>
        <genre>Computer</genre>
        <price>44.95</price>
        <publish_date>2000-10-01</publish_date>
        <description>An in-depth look at creating applications with XML.</description>
    </book>
    <book id="bk102">
        <author>Ralls, Kim</author>
        <title>Midnight Rain</title>
        <genre>Fantasy</genre>
        <price>5.95</price>
        <publish_date>2000-12-16</publish_date>
        <description>A former architect battles corporate zombies, an evil sorceress, and her own childhood to become queen of the world.</description>
    </book>
</catalog>
`;


function getAllDescendants(nodes,level) {
    let tb = level + "  ";
    for (let child of nodes) {
       children = child.children
       if( children.length == 0 ){
           console.log(tb+ " "+child.nodeName+" : " +child.textContent);
       }else{
           console.log(tb+ " "+child.nodeName);
           let subChildren = getAllDescendants(children,tb);
       }
    }
}

function scanning( xmlString ){

   const xmlDoc = parser.parseFromString(xmlString, "application/xml");

   if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      console.error("Error parsing XML");
      return;
   }

//   const books = xmlDoc.getElementsByTagName("metadataFormat");
   const books = xmlDoc.getElementsByTagName("OAI-PMH");
//   const books = xmlDoc.getElementsByTagName("ListMetadataFormats");
   getAllDescendants(books,"")
}
const dom    = new JSDOM();
const parser = new dom.window.DOMParser();



fs.readFile('example.xml', 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
  //  console.log(data);
    scanning(data);
});

