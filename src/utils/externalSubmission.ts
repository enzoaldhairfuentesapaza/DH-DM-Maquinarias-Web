/** Register in our API before navigating the external compose window. */
export async function registerAndOpen(url:string, register:()=>Promise<unknown>):Promise<void> {
  const tab=window.open("about:blank","_blank");
  if(tab)tab.opener=null;
  try {await register();if(tab&&!tab.closed)tab.location.replace(url);else window.open(url,"_blank","noopener,noreferrer");}
  catch(error){if(tab&&!tab.closed)tab.close();throw error;}
}
