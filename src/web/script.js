let currentPage = 0;
const pageSize = 5;
let items = [];

// ---------------------------------------
function loadData() {
// ---------------------------------------
    const detailContainer = document.getElementById('detail');
    detailContainer.innerHTML = '' ;
    currentPage = 0;
    fetch('/api/identifiers?verb=ListIdentifiers&metadataPrefix=oai_dc')
        .then(response => response.text())
        .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
        .then(data => {
            items = Array.from(data.querySelectorAll('header'));
            displayPage(currentPage);
        })
        .catch(err => console.error('Error loading XML data:', err));
}
// ---------------------------------------
function fetchDetails() {
// ---------------------------------------
   
    const identifier = this.identifier;
    console.log("Identifier: "+identifier);

    fetch('/api/identifiers?verb=GetRecord&identifier='+identifier+'&metadataPrefix=oai_dc')
        .then(response => response.text())
        .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
        .then(data => { drawDetailTable( identifier , data ) } )
        .catch(err => console.error('Error loading XML data:', err));
}
// ---------------------------------------
function getKey( item , key ){
// ---------------------------------------
   const x = item.querySelector(key);
   return x ? x.textContent : "N.A."
}
// ---------------------------------------
function drawDetailTable( identifier , data ){
// ---------------------------------------

    const detailContainer = document.getElementById('detail');
    detailContainer.innerHTML = '' ;
    const h = document.createElement('h3')
    h.innerHTML = identifier;
    detailContainer.appendChild(h)
    
    const desc = Array.from(data.querySelectorAll('metadata'));
    if( desc.length < 1 )return 
    const item = desc[0] ;
    
    const table     = document.createElement('table');
    const header    = table.createTHead();
    const headerRow = header.insertRow();

    [ "Name", "Value"].forEach(text => {
        let th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });

    [ [ "title" ,     "Title"        ] ,
      [ "identifier", "Identifier"   ] ,
      [ "date", "Date"  ]  ,
      [ "creator", "Creator"  ]  ,
      [ "type", "Type"  ]  ,
      [ "publisher", "Publisher"  ]  ,
      [ "rights", "Rights"  ]  ,
    ].forEach(pointer => { 
        const row         = table.insertRow();
        const titleColumn = row.insertCell();
        titleColumn.textContent = pointer[1] ;
        titleColumn.className   = 'title' ;
        row.insertCell().textContent = getKey(item,pointer[0]) ;
    })
    detailContainer.appendChild(table);
}
// ---------------------------------------
function displayPage(page) {
// ---------------------------------------
    const container = document.getElementById('data');
    container.innerHTML = '';
    const table = document.createElement('table');

    // Header setup if needed
    const header = table.createTHead();
    const headerRow = header.insertRow();
    ["Action", "Name", "Value"].forEach(text => {
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


// Initial data load
loadData();

