'use client'

import { redirect, permanentRedirect, useRouter, RedirectType, usePathname, useSearchParams } from 'next/navigation'

// export default function Page() {
//     //redirect('/SubApp')
//     const path = usePathname()
//     const searchParam = useSearchParams()

//     console.log( path, searchParam, URLSearchParams )
//     const router = useRouter()
//     //const res = redirect('https://naver.com' ); this line executed when component created on server

//     return <>
//         <button onClick={ () => {    
//             router.push( '/SubApp')
//             //const res = redirect('https://naver.com' ); this line does not work on client component
//         } } >Move page</button>
//     </>
// }
 
// export function SortProducts() {
//   const searchParams = useSearchParams()
//   console.log(searchParams, searchParams.toString())
 
//   function updateSorting(sortOrder: string) {
//     const params = new URLSearchParams(searchParams.toString())
//     params.set('sort', sortOrder)
//     window.history.pushState(null, '', `?${params.toString()}`)
//   }

//   function forward() {
//     window.history.forward();
//   }
//   function back() {
//     window.history.back();
//   }
//   return (
//     <>
//       <button onClick={() => updateSorting('asc')}>Sort Ascending</button>
//       <button onClick={() => updateSorting('desc')}>Sort Descending</button>      
//       <button onClick={() => forward()}>forward</button>
//       <button onClick={() => back()}>back</button>
//     </>
//   )
// }

 
// export function LocaleSwitcher() {
//   const pathname = usePathname()
 
//   function switchLocale(locale: string) {
//     // e.g. '/en/about' or '/fr/contact'
//     const newPath = `/${locale}${pathname}`
//     window.history.replaceState(null, '', newPath)
//   }
 
//   return (
//     <>
//       <button onClick={() => switchLocale('en')}>English</button>
//       <button onClick={() => switchLocale('fr')}>French</button>
//     </>
//   )
// }

export default function PermanentRedirect() {
  return (
    <>
      <button onClick={() => redirect('/SubApp')}>Just Redirect</button>
      <button onClick={() => permanentRedirect('/SubApp')}>Permanent Redirect</button>
    </>
  )
}