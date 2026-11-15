import Forum from '../Forum';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <Forum id={id}/>;}
