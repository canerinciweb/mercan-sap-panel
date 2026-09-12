export default function UploadPanel({
handleZparti,
handleZpp,
zpartiName,
zppName
}){

return(

<div className="upload">

<div>

<input
type="file"
accept=".xlsx,.xls"
onChange={e=>handleZparti(e.target.files[0])}
/>

<div>{zpartiName||"ZPARTI seçilmedi"}</div>

</div>

<div>

<input
type="file"
accept=".xlsx,.xls"
onChange={e=>handleZpp(e.target.files[0])}
/>

<div>{zppName||"ZPPSTOK seçilmedi"}</div>

</div>

</div>

);
}