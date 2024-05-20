let currentPage = 0;
const pageSize = 10;
let items = [];
let current_schema      = 'oai_dc' ;
let availableSchemas    = {} 
let errorMessage = document.getElementById('errorMessage');
if( errorMessage ){
    errorMessage.onclick = function() {
        errorMessage.innerHTML = ""
    }
}

// ---------------------------------------
function loadData( schema  ) {
// ---------------------------------------
    current_schema  = schema;

    setSchemaName( current_schema );
    console.log("Loading : ["+current_schema+"]")

    const detailContainer = document.getElementById('detail');
    detailContainer.innerHTML = '' ;
    currentPage = 0;
    fetch('/api/identifiers?verb=ListIdentifiers&metadataPrefix='+current_schema)
        .then(response => response.text())
        .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
        .then(data => {
            error = Array.from(data.querySelectorAll('error'));
            if( error && error.length > 0 ){
                console.error( error[0].textContent )
                throw Error(error[0].textContent)
            }
            items = Array.from(data.querySelectorAll('header'));
            displayPage(currentPage);
        })
        .catch(err => {
            console.error('Error loading XML data:', err)
            displayErrorMessage(""+err)
        });
}
// ---------------------------------------
function displayErrorMessage( message ){
// ---------------------------------------

    if( errorMessage )errorMessage.innerHTML = message ;
}
// ---------------------------------------
function fetchDetails() {
// ---------------------------------------
       
        const identifier = this.identifier;
        console.log("Identifier: "+identifier);
    
        fetch('/api/identifiers?verb=GetRecord&identifier='+identifier+'&metadataPrefix='+current_schema)
            .then(response => response.text())
            .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
            .then(data => { 
                error = Array.from(data.querySelectorAll('error'));
                if( error && error.length > 0 ){
                    console.error( error[0].textContent )
                    throw Error(error[0].textContent)
                }
                drawDefinedDetailTable( identifier , data ) 
            } )
            .catch(err => console.error('Error loading XML data:', err));
}
// ---------------------------------------
function storeAvailableSchemas(data) {
// ---------------------------------------
    availableSchemas = {}
    list = data.querySelectorAll('ListMetadataFormats')
    for (let formats of list) {
        for( let format_key_list of formats.children ){
           const format_keys = {}
           for( let x of format_key_list.children ){
              format_keys[x.nodeName] = x.textContent ;
           }
           let key = format_keys['metadataPrefix'] ;
           if( key )availableSchemas[key] = format_keys ;
        }
    }
    console.log( availableSchemas)
    createSchemaTable(availableSchemas)
}    
// ---------------------------------------
function fetchSchemas() {
// ---------------------------------------
       
    console.log("Fetching Schemas");
    
    fetch('/api/identifiers?verb=ListMetadataFormats')
        .then(response => response.text())
        .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
        .then(data => { 
            error = Array.from(data.querySelectorAll('error'));
            if( error && error.length > 0 ){
                console.error( error[0].textContent )
                throw Error(error[0].textContent)
            }
            storeAvailableSchemas( data ) 
        } )
        .catch(err => console.error('Error loading XML data:', err));
}    
// ---------------------------------------
function getKey( item , key ){
// ---------------------------------------
   const x = item.querySelector(key);
   return x ? x.textContent : "N.A."
}
// ---------------------------------------
function getAllDescendants2(nodes,collector) {
// ---------------------------------------
    for (let child of nodes) {
       children = child.children
       if( children.length == 0 ){
          console.log(child.nodeName+" : " +child.textContent);
            collector[child.nodeName] = child.textContent
       }else{
           console.log(child.nodeName);
           let subChildren = getAllDescendants(children,collector);
       }
    }
}
// ---------------------------------------
function getAllDescendants(nodes,collector) {
// ---------------------------------------
    for (let resource of nodes) {
       for( let item of resource.children ){
           for( let xx of item.children ){
              if( xx.children.length > 0){
                  let position = 0
                  for( let subItem of xx.children ){
                      let value = xx.textContent ;
                      let attrValues = "("
                      for( let attr of subItem.attributes){
                         console.log(attr.name + ': ' + attr.value)
                         attrValues = attrValues  + attr.value+ "," ;
                      }
                      if( attrValues == "("){
                         attrValues = "";
                      }else{
                         attrValues = attrValues.slice(0,-1) + ")";
                      }
                      collector[subItem.nodeName+"["+position+"]"+attrValues] = value ;
                      position = position + 1;
                  }         
              }else{
                  collector[xx.nodeName] = xx.textContent;
              }
            }
       }
    }
}
    
// ---------------------------------------
function setSchemaName( name ){
// ---------------------------------------

    const schemaName = document.getElementById('schema_name');
    console.log("Setting "+schemaName+" "+name)
    schemaName.textContent = "Schema <"+name+">";
    schemaName.classname   = 'schema_name'
}
// ---------------------------------------
function drawDetailTable( identifier , data ){
// ---------------------------------------

const detailContainer = document.getElementById('detail');
detailContainer.innerHTML = '' ;
const h = document.createElement('h3')
h.innerHTML = identifier;
detailContainer.appendChild(h)

const table     = document.createElement('table');
    const header    = table.createTHead();
    const headerRow = header.insertRow();

    [ "Name", "Value"].forEach(text => {
        let th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });

    let root = data.querySelectorAll('metadata')

    detailContainer.appendChild(table);
}
// ---------------------------------------
function drawDefinedDetailTable( identifier , data ){
// ---------------------------------------
        
    const detailContainer = document.getElementById('detail');
    detailContainer.innerHTML = '' ;
    const h = document.createElement('h3')
    h.innerHTML = identifier;
    detailContainer.appendChild(h)
    
    const table     = document.createElement('table');
    const header    = table.createTHead();
    const headerRow = header.insertRow();

    [ "Name", "Value"].forEach(text => {
        let th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });

    const collector = {} ;

    getAllDescendants( data.querySelectorAll('metadata') ,collector) ;

    for (const key in collector) {
        if (collector.hasOwnProperty(key)) {
            console.log(`${key}: ${collector[key]}`);
            const row         = table.insertRow();
            const titleColumn = row.insertCell();
            titleColumn.textContent = key ;
            titleColumn.className   = 'title' ;
            row.insertCell().textContent = collector[key] ;
    
        }
    }
    
    detailContainer.appendChild(table);
}
// ---------------------------------------
function displayPage(page) {
// ---------------------------------------
    const container = document.getElementById('data');
    container.innerHTML = '';
    const table = document.createElement('table');

    // Header setup if needed
    const header    = table.createTHead();
    const headerRow = header.insertRow();
    ["Action", "Identifier", "Time Recorded"].forEach(text => {
        let th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });

    // Ensuring button is in the first cell
    const pageItems = items.slice(page * pageSize, (page + 1) * pageSize);
    pageItems.forEach((item, index) => {
        const row = table.insertRow();
        const buttonCell = row.insertCell();
        buttonCell.className = 'button-cell';
        
        identifier = item.querySelector('identifier').textContent;
        datestamp  = item.querySelector('datestamp').textContent;

        const detailButton = document.createElement('button');
        detailButton.textContent = 'Details';
        detailButton.identifier  = identifier ;
        detailButton.onclick     = fetchDetails;

        buttonCell.appendChild(detailButton);

        // Adding other data cells
        row.insertCell().textContent = identifier ;
        row.insertCell().textContent = datestamp;
    });

    container.appendChild(table);
}
// ---------------------------------------
function nextPage() {
// ---------------------------------------
    if ((currentPage + 1) * pageSize < items.length) {
        currentPage++;
        displayPage(currentPage);
    }
}
// ---------------------------------------
function prevPage() {
// ---------------------------------------
    if (currentPage > 0) {
        currentPage--;
        displayPage(currentPage);
    }
}
dictexample = { 
    oai_dc : { metadataFormat : "oai_dc" , schema : "akdasdf" , metadataNamespace : "adfjadf"} ,
    panosc : { metadataFormat : "panosc" , schema : "akdasdf" , metadataNamespace : "adfjadf"} ,
    data_cite : { metadataFormat : "datasite" , schema : "akdasdf" , metadataNamespace : "adfjadf"} 
};
// ---------------------------------------
function on_schema_click( details ){
// ---------------------------------------
   const schema_name = details.srcElement.innerText ;
   schema_details = availableSchemas[details.srcElement.innerText] ;
   loadData( schema_name )
}
// ---------------------------------------
function createSchemaTable(dict){
    // ---------------------------------------
        const table = document.getElementById('schema_table');
    
        for (let key in dict) {
            if( ! dict.hasOwnProperty(key) )continue ;
            console.log(key, dict[key]);
            schema_row = dict[key]
    
            const row1    = document.createElement('tr');
            const cell1_1 = document.createElement('td');
            const button  = document.createElement('button');
            button.innerText = schema_row["metadataPrefix"] ;
            button.addEventListener('click',on_schema_click);
            cell1_1.appendChild(button);
    
            cell1_1.className   = "button-cell"
            row1.appendChild(cell1_1);
    
            const cell1_2 = document.createElement('td');
            cell1_2.className = "schema_table_body";
            cell1_2.textContent = schema_row["schema"];
            row1.appendChild(cell1_2);
        
            const cell2_2 = document.createElement('td');
            cell2_2.className = "schema_table_body";
    
            cell2_2.textContent = schema_row["metadataNamespace"];
            row1.appendChild(cell2_2);

            table.appendChild(row1);

            table.appendChild(row1);
        }
    }
// ---------------------------------------
function createSchemaTable_two_rows(dict){
// ---------------------------------------
    const table = document.getElementById('schema_table');

    for (let key in dict) {
        if( ! dict.hasOwnProperty(key) )continue ;
        console.log(key, dict[key]);
        schema_row = dict[key]

        const row1    = document.createElement('tr');
        const cell1_1 = document.createElement('td');
        const button  = document.createElement('button');
        button.innerText = schema_row["metadataPrefix"] ;
        button.addEventListener('click',on_schema_click);
     //   cell1_1.textContent = schema_row["metadataPrefix"] ;
        cell1_1.appendChild(button);

        cell1_1.rowSpan     = 2; // This cell will span two rows
        cell1_1.className   = "button-cell"
        row1.appendChild(cell1_1);

        const cell1_2 = document.createElement('td');
        cell1_2.className = "schema_table_body";
        cell1_2.textContent = schema_row["schema"];
        row1.appendChild(cell1_2);

        table.appendChild(row1);

        const row2 = document.createElement('tr');
        const cell2_2 = document.createElement('td');
        cell2_2.className = "schema_table_body";

        cell2_2.textContent = schema_row["metadataNamespace"];
        row2.appendChild(cell2_2);

        table.appendChild(row2);
    }
}

// Initial data load
fetchSchemas()

loadData('oai_dc');

