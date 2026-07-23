// About · Furnihub
export const dynamic = 'force-dynamic';

export default function AboutPage() {
  return (
    <div className="container-x py-16 max-w-4xl">
      <h1 className="font-display text-4xl font-semibold text-brand-900 mb-6">About Furnihub</h1>
      <p className="text-lg text-gray-700 leading-relaxed mb-8">
        Furnihub is a Kunhe & Co. venture — built around <strong>integrated sourcing service value</strong>,
        not middleman margin. We connect furniture retailers worldwide with verified Chinese factories,
        handle quality control, and consolidate mixed-SKU containers at FOB pricing.
      </p>

      <div className="grid md:grid-cols-2 gap-10 my-12">
        <div>
          <h2 className="font-display text-2xl font-semibold text-brand-900 mb-3">Our Model</h2>
          <p className="text-gray-700 leading-relaxed">
            We don't just resell. We integrate: sourcing, sample coordination, production tracking,
            in-line QC, container consolidation, and booking assistance. One partner · clear accountability ·
            FOB pricing you can verify.
          </p>
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold text-brand-900 mb-3">Trust Metrics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4 text-center">
              <div className="text-3xl font-bold text-brand-700">15+</div>
              <div className="text-xs text-gray-500">Years Experience</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-bold text-brand-700">200+</div>
              <div className="text-xs text-gray-500">SKUs</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-bold text-brand-700">2-3</div>
              <div className="text-xs text-gray-500">Partner Factories</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-bold text-brand-700">5-pc</div>
              <div className="text-xs text-gray-500">Minimum Order</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-8 bg-brand-50 border-brand-100">
        <h2 className="font-display text-xl font-semibold text-brand-900 mb-2">Ready to start sourcing?</h2>
        <p className="text-gray-700 mb-4">Create a free account to browse full FOB pricing and start building your container.</p>
        <a href="/signup" className="btn-primary">Sign Up Free</a>
      </div>
    </div>
  );
}
