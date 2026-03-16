export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-3xl">
      <h1 className="text-4xl font-bold mb-8 text-white">Privacy Policy</h1>
      <div className="glass-card p-10 flex flex-col gap-6 text-gray-400 leading-relaxed">
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-white italic">1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us when you create an account, such as your username, display name, and GitHub/Google profile information. 
            We also store the build logs and content hashes you intentionally publish to the platform.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-white italic">2. How We Use Information</h2>
          <p>
            Your data is used to provide, maintain, and improve the Argentum platform. 
            Content hashes are used to provide immutable proof of your build progress and are intended to be public.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-white italic">3. Data Integrity & Verification</h2>
          <p>
            Argentum is built on the principle of "Prove it forever." 
            Once a content hash is generated and published, it serves as a permanent record of your work at that specific point in time. 
            We do not modify published content hashes.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-white italic">4. Third-Party Services</h2>
          <p>
            We use Supabase for authentication and database management. 
            Your use of Argentum is also subject to the privacy policies of our authentication providers (GitHub and Google).
          </p>
        </section>

        <div className="mt-8 pt-8 border-t border-white/5 flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Last Updated: March 2026</span>
            <span className="text-[10px] font-bold text-accent uppercase tracking-widest italic">Argentum Protocol</span>
        </div>
      </div>
    </div>
  )
}
