export default function Terms() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-3xl">
      <h1 className="text-4xl font-bold mb-8 text-white">Terms of Service</h1>
      <div className="glass-card p-10 flex flex-col gap-6 text-gray-400 leading-relaxed">
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-white italic">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Argentum, you agree to be bound by these Terms of Service and all applicable laws and regulations. 
            If you do not agree with any of these terms, you are prohibited from using this site.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-white italic">2. Use License</h2>
          <p>
            Argentum is a platform for building in public. You retain ownership of the content you publish, 
            but you grant Argentum a non-exclusive, worldwide, royalty-free license to display and verify your content hashes.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-white italic">3. Content Verification</h2>
          <p>
            You are solely responsible for the content you publish. Argentum provides a mechanism for hashing content to prove its existence 
            and integrity at a point in time, but does not verify the truthfulness or quality of the content itself.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-white italic">4. Prohibited Conduct</h2>
          <p>
            You agree not to use Argentum for any unlawful purpose or to publish content that is malicious, 
            spammy, or infringing upon the intellectual property of others.
          </p>
        </section>

        <div className="mt-8 pt-8 border-t border-white/5 flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Effective Date: March 2026</span>
            <span className="text-[10px] font-bold text-accent uppercase tracking-widest italic">Argentum Protocol</span>
        </div>
      </div>
    </div>
  )
}
