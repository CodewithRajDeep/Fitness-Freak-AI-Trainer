
import React from 'react'

const HomePage = () => {
  return (
    <div className='flex flex-col min-h-screen text-foreground overflow-hidden'>
      <section className='relative z-10 py-24 flex-grow'>
        <div className='container mx-auto px-4'>
           <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative'>
             <div className='absolute -top-10 left-0 2-40 h-40 border-l-2 border-t-2 border-border'>
               <div className='lg:col-span-7 space-y-8 relative'>
                 <h1 className='text-5xl md:text-6xl lg:text-7xl font-bold tracking-light'>
                  <div>
                    <span className='text-foreground'>Transform</span>
                  </div>
                  <div>
                    <span className='text-primary'>Your Body</span>
                  </div>
                  <div className='pt-2'>
                    <span className='text-foreground'>with Fitness</span>
                  </div>
                  <div className='pt-2'>
                    <span className='text-foreground'>Freak-AI</span>
                    <span className='text-primary'>Technology</span>
                  </div>
                 </h1>

                 <div className='h-px w-full bg-gradient-to-r from-primary via-secondary to-primary opacity-50'>
                 </div>
                 <p className='text-xl text-muted-foreground w-2/3'>
                  Meet with our AI assistant and get personalized workout and diet plans tailored to your fitness goals and preferences.
                 </p>
                 <div className='flex items-center gap-10 py-6 font-mono'>
                   <div className='flex flex-col'>
                     <div className='text-2xl text-primary'>500+</div>
                     <div className='text-xs uppercase tracking-wider'>ACTIVE USER</div>
                   </div>

                   <div className='h-12 w-px bg-gradient-to-b from-transparent via-border to-transaparent'></div>
                   
                    <div className='flex flex-col'>
                      <div className='text-2xl text-primary'>2min</div>
                      <div className='text-xs uppercase tracking-wider'>GENERATION</div>
                    </div>

                    <div className='h-12 w-px bg-gradient-to-b from-transparent via-border to-transparent'></div>
                    
                      <div className='flex flex-col'>
                        <div className='text-2xl text-primary'>100%</div>
                        <div className='text-xs uppercase tracking-wider'>PERSONALIZED</div>
                      </div>
                 </div>
               </div>

             </div>
           </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
