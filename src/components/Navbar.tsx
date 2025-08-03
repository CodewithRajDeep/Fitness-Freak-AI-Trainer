"use client"
import { useUser } from '@clerk/nextjs'
import { DumbbellIcon, HomeIcon, ZapIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const Navbar = () => {
    const {isSignedIn} = useUser()
  return (
   <header className='fixed top-0 inset-x-0 z-50 bg-background/60 backdrop-blur-md border-b border-border py-3'>
       <div className='container mx-auto flex items-center justify-between'>
        <Link href="/" className='flex items-center gap-2'>
         <div className='p-1 bg-primary/10 rounded'>
            <ZapIcon className='w-4 h-4 text-primary'/>
         </div>
         <span className='text-xl font-bold font-mono'>
           fitness <span className='text-primary'>freak</span>
         </span>
         </Link>
         
         <nav className='flex items-center gap-5'>
           {isSignedIn ? (
            <>
             <Link href="/" className='flex items-center gap-1.5 text-sm hover:text-primary transition-colors'>
             <HomeIcon size={16}/>
             <span>Home</span>
             </Link>

             <Link href="/generate-program" className='flex items-center gap-1.5 text-sm hover:text-primary transition-colors'>
              <DumbbellIcon size={16}/>
              <span>Generate</span>
             </Link>
            </>
           ) : " "}
         </nav>
       </div>
    </header>
  )
}

export default Navbar
