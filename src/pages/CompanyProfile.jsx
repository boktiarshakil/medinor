import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { MdDownload, MdPhone, MdEmail, MdArrowForward } from 'react-icons/md'

const MANAGEMENT = [
  {
    name: 'Ahsan Abdullah',
    role: 'Chairman',
    initials: 'AA',
    bio: 'He belongs to Bangladesh Civil Service (BCS) 1984 batch and joined civil service in 1986. He worked in Ministry of Communications and Ministry of Railways, Finance division, Ministry of Education, Ministry of Commerce during different capacities in his long career. He worked in financial management, project development and management, policy formulation, studies and surveys, training, donor / funder negotiation etc.',
  },
  { name: 'Monoauar Hossain Moinul', role: 'Managing Director', initials: 'MM', photo: '/managers/monoauar-hossain-moinul.jpg' },
  { name: 'Ikramul Islam Chowdhury', role: 'Director Admin', initials: 'IC', photo: '/managers/ikramul-islam-chowdhury.jpg' },
  { name: 'Michael Chowdhury', role: 'Executive Director', initials: 'MC', photo: '/managers/michael-chowdhury.jpg' },
  { name: 'Md Saidur Rahman', role: 'Operations Director', initials: 'SR' },
]

const CAPABILITIES = [
  'Nationwide market coverage across institutional, retail, dealer, telemarketing, and online channels.',
  'Established experience in importing and distributing healthcare, medical, and cosmetic products.',
  'Dedicated representation and promotional support for MEDIRON® medical equipment.',
  'Broad access to healthcare institutions, pharmacies, retailers, corporate organizations, and consumers.',
  'Coordinated operations across sales, marketing, order processing, and customer support.',
  'Careful product selection based on quality, safety, regulatory, commercial, and market requirements.',
  'A customer-focused approach designed to improve accessibility, responsiveness, and long-term value.',
]

const MEDIRON_PROPS = [
  { title: 'Reliable', desc: 'Accurate measurement and consistent performance.' },
  { title: 'Easy to Use', desc: 'Convenient operation for every user.' },
  { title: 'Clear Displays', desc: 'Clear digital displays and readings.' },
  { title: 'Durable', desc: 'Robust product construction.' },
  { title: 'User-Friendly', desc: 'Design built around real-world use.' },
  { title: 'Practical', desc: 'For healthcare professionals and home users alike.' },
]

const PRODUCT_RANGE = [
  { name: 'Blood Pressure Monitors', note: 'Advance & Prime, 3-yr warranty', image: '/dealer/bp-advance-medi447.png' },
  { name: 'Blood Glucose Meter', note: '5-second result, Lifetime warranty', image: '/dealer/glucose-meter.png' },
  { name: 'Glucose Test Strips', note: 'Auto-coded, 50 & 100 packs', image: '/dealer/strips-50.png' },
  { name: 'Blood Lancets', note: 'Sterile single-use, 31G', image: '/dealer/lancets-31g.png' },
  { name: 'Compressor Nebulizer', note: 'Low noise, 3-yr warranty', image: '/dealer/nebulizer.png' },
  { name: 'Examination Gloves', note: 'Your Partner in Protection', image: '/dealer/gloves.png' },
]

const PORTFOLIO = [
  { product: 'Automatic BP Monitor', models: 'MEDIRON Advance (MEDI 447), MEDIRON Prime (MEDI-712)', assurance: '3-year warranty', registration: 'DGDA Class B' },
  { product: 'Blood Glucose Meter', models: 'MEDIRON Blood Glucose Monitoring System', assurance: 'Lifetime warranty', registration: 'DGDA Class C' },
  { product: 'Blood Glucose Test Strips', models: '25x2 = 50, 50x2 = 100 strips', assurance: 'CE certified', registration: 'DGDA Class C' },
  { product: 'Blood Lancets (Twist Type)', models: '31G, 100 pcs per box', assurance: 'CE 0197', registration: 'DGDA Class B' },
  { product: 'Compressor Nebulizer', models: 'MEDIRON MED-1240', assurance: '3-year warranty', registration: 'DGDA Class B' },
  { product: 'Examination Gloves', models: 'NR latex, powdered, non-sterile', assurance: 'CE 0086', registration: '—' },
  { product: 'Thermometers & Others', models: 'Digital thermometers, monitoring equipment', assurance: '—', registration: '—' },
]

function SectionHeader({ title, subtitle }) {
  return (
    <div className="text-center mb-10">
      <h2 className="font-brandname text-2xl md:text-3xl font-bold text-gray-900 uppercase tracking-wide">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
    </div>
  )
}

function SpecTable({ rows }) {
  return (
    <div className="table-container mt-6">
      <table className="data-table">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td className="font-semibold text-gray-900 w-44">{label}</td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FeatureList({ items }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
      {items.map((item, i) => (
        <div key={i} className="card p-4">
          <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
        </div>
      ))}
    </div>
  )
}

export default function CompanyProfile() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="font-logo text-lg leading-none text-white select-none tracking-[-0.09em]">mms.</span>
            </div>
            <div>
              <span className="font-brandname text-sm font-bold text-gray-900 uppercase tracking-wide">MMS Prime</span>
              <span className="block text-[10px] text-gray-400 -mt-0.5">Delivering Value Every Day</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
            <button onClick={() => navigate('/')} className="hover:text-brand-500">Home</button>
            <button onClick={() => navigate('/company-profile')} className="hover:text-brand-500">Company Profile</button>
            <button onClick={() => navigate('/')} className="hover:text-brand-500">Products</button>
            <button onClick={() => navigate('/')} className="hover:text-brand-500">Contact</button>
          </nav>
          <div className="flex items-center gap-2">
            <a href="/company-profile.pdf" target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm hidden md:inline-flex">
              <MdDownload size={16} /> Download Profile (PDF)
            </a>
            {user ? (
              <button className="btn-primary text-sm" onClick={() => navigate('/dashboard')}>
                Dashboard <MdArrowForward size={15} />
              </button>
            ) : (
              <button className="btn-primary text-sm" onClick={() => navigate('/login')}>
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-brand-500 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-24 text-center relative z-10">
          <h1 className="font-brandname text-4xl md:text-5xl font-bold text-white uppercase tracking-wide">MMS Prime</h1>
          <p className="font-tagline text-xl md:text-2xl text-white italic mt-3 uppercase">Delivering Value Every Day</p>
          <p className="text-white/90 font-semibold tracking-widest text-xs md:text-sm mt-5">Importer • Distributor • Marketer</p>
          <p className="text-white/85 text-sm md:text-base mt-2">Healthcare, Medical Equipment &amp; Cosmetic Products</p>
          <p className="text-white/85 text-sm md:text-base mt-1">Nationwide Distributor and Marketer of MEDIRON® Medical Equipment</p>
          <div className="flex flex-col items-center justify-center gap-2 mt-8 text-white/90 text-sm">
            <p>23, Shahid Captain Monsur Ali Sarani (2nd Floor), Ramna, Dhaka-1217, Bangladesh</p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              <span className="flex items-center gap-1.5"><MdPhone size={15} /> +880 13 55 9 44 8 66</span>
              <span className="flex items-center gap-1.5"><MdPhone size={15} /> +880 17 90 60 60 57</span>
              <span className="flex items-center gap-1.5"><MdPhone size={15} /> +880 18 18 27 64 24</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              <span className="flex items-center gap-1.5"><MdEmail size={15} /> mmsprimebd@gmail.com</span>
              <span>www.mmsprime.bd</span>
              <span>facebook.com/mmsprime26</span>
            </div>
          </div>
          <div className="mt-8">
            <a href="/company-profile.pdf" target="_blank" rel="noopener noreferrer" className="bg-white text-brand-600 font-semibold rounded-xl px-7 py-3 text-sm hover:opacity-95 transition-opacity shadow-lg inline-flex items-center gap-2">
              <MdDownload size={16} /> Download Profile (PDF)
            </a>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-white/10" />
      </section>

      {/* Vision & Mission */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <SectionHeader title="Purpose That Guides Us" subtitle="Building a trusted healthcare distribution platform for Bangladesh" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-7 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-500" />
            <p className="text-[11px] font-bold text-brand-500 uppercase tracking-widest">Our Vision</p>
            <h3 className="text-lg font-bold text-gray-900 mt-1">A trusted national platform</h3>
            <p className="text-sm text-gray-600 leading-relaxed mt-3">
              To build a trusted and professionally managed healthcare, medical equipment, and
              cosmetic distribution platform in Bangladesh by making quality products more
              accessible to people, healthcare professionals, institutions, and businesses.
            </p>
          </div>
          <div className="card p-7 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-500" />
            <p className="text-[11px] font-bold text-brand-500 uppercase tracking-widest">Our Mission</p>
            <h3 className="text-lg font-bold text-gray-900 mt-1">Import. Distribute. Serve.</h3>
            <p className="text-sm text-gray-600 leading-relaxed mt-3">
              To import, distribute, and market reliable healthcare, medical equipment, and
              cosmetic products through professional service, responsible business practices,
              integrated sales channels, and a strong nationwide network.
            </p>
          </div>
        </div>
      </section>

      {/* Management */}
      <section className="bg-surface-50 border-y border-gray-100 py-14">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHeader title="Our Management" subtitle="Leadership committed to professional service and responsible growth" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {MANAGEMENT.map(person => (
              <div key={person.name} className="card card-hover p-6 text-center">
                {person.photo ? (
                  <img src={person.photo} alt={person.name} className="w-16 h-16 mx-auto rounded-full object-cover shadow-lg shadow-brand-500/20" loading="lazy" />
                ) : (
                  <div className="w-16 h-16 mx-auto rounded-full bg-brand-500 text-white flex items-center justify-center font-brandname text-lg font-bold tracking-wide shadow-lg shadow-brand-500/20">
                    {person.initials}
                  </div>
                )}
                <h3 className="text-sm font-semibold text-gray-900 mt-4 leading-snug">{person.name}</h3>
                <p className="text-[11px] font-medium text-brand-500 uppercase tracking-wide mt-1">{person.role}</p>
                {person.bio && (
                  <p className="text-xs text-gray-500 leading-relaxed mt-3 text-left">{person.bio}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Executive Summary */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <SectionHeader title="Executive Summary" />
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-gray-600 leading-relaxed">
            MMS Prime is a Bangladesh-based importer, distributor, and market-development company
            specializing in healthcare products, medical equipment, and cosmetic products. The company
            also serves as the nationwide distributor and marketer of MEDIRON® medical equipment.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-4">
            MMS Prime combines nationwide distribution capabilities with multiple market-access channels,
            including institutional sales, retail and dealer networks, telemarketing, and online sales.
            This integrated approach connects suppliers and brands with healthcare institutions,
            professionals, pharmacies, retailers, businesses, and individual consumers across Bangladesh.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-4">
            For customers and business partners, MMS Prime offers more than product distribution. The
            company provides market coverage, channel development, product promotion, order coordination,
            customer communication, and responsive after-sales support through a professionally managed
            operating structure.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
          <div className="card p-5 text-center">
            <p className="text-2xl font-bold text-brand-500">5</p>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide mt-1">DGDA-registered categories</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-2xl font-bold text-brand-500">3 Yrs</p>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide mt-1">Warranty on BP monitors &amp; nebulizer</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-2xl font-bold text-brand-500">Lifetime</p>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide mt-1">Warranty on glucose meter</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-2xl font-bold text-brand-500">Nationwide</p>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide mt-1">Distribution across Bangladesh</p>
          </div>
        </div>
      </section>

      {/* Distinctive Capabilities */}
      <section className="bg-surface-50 border-y border-gray-100 py-14">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHeader title="Our Distinctive Capabilities" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CAPABILITIES.map((cap, i) => (
              <div key={i} className="card card-hover p-5">
                <p className="text-sm text-gray-700 leading-relaxed">{cap}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About MEDIRON */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <SectionHeader title="About MEDIRON®" subtitle="Healthcare monitoring and diagnostic products for home and clinical use" />
        <p className="text-sm text-gray-600 leading-relaxed max-w-3xl mx-auto text-center">
          MEDIRON® is a medical equipment brand offering healthcare monitoring and diagnostic products
          for home healthcare monitoring and clinical applications. MMS Prime is the nationwide
          distributor and marketer of MEDIRON® in Bangladesh.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-10">
          {MEDIRON_PROPS.map(prop => (
            <div key={prop.title} className="card card-hover p-5 text-center">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{prop.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mt-2">{prop.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 leading-relaxed max-w-3xl mx-auto text-center mt-10">
          Where applicable, MEDIRON® products are manufactured in accordance with relevant international
          quality and regulatory requirements, including ISO 13485, CE Marking, and applicable TÜV
          certification, according to the specific product and certification scope. Where applicable to
          the relevant medical devices, the brand is supported by SUNGO Europe B.V., Amsterdam,
          Netherlands, as its European Authorized Representative.
        </p>
      </section>

      {/* Product Range */}
      <section className="bg-surface-50 border-y border-gray-100 py-14">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHeader title="Our Product Range" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {PRODUCT_RANGE.map(item => (
              <div key={item.name} className="card card-hover overflow-hidden">
                <div className="aspect-[4/3] bg-gray-50 overflow-hidden flex items-center justify-center p-4">
                  <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain" loading="lazy" />
                </div>
                <div className="p-4 text-center">
                  <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{item.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio at a Glance */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <SectionHeader title="Portfolio at a Glance" />
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Models / Pack</th>
                <th>Assurance</th>
                <th>Registration</th>
              </tr>
            </thead>
            <tbody>
              {PORTFOLIO.map(row => (
                <tr key={row.product}>
                  <td className="font-semibold text-gray-900">{row.product}</td>
                  <td>{row.models}</td>
                  <td>{row.assurance}</td>
                  <td>{row.registration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Product details */}
      <section className="bg-surface-50 border-y border-gray-100 py-14">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHeader title="Product Details" subtitle="Specifications and DGDA registrations for the core MEDIRON® range" />

          {/* 01 BP Monitors */}
          <div className="card p-6 md:p-8 mb-6">
            <p className="text-[11px] font-bold text-brand-500 uppercase tracking-widest">01</p>
            <h3 className="text-xl font-bold text-gray-900 mt-1">Automatic Blood Pressure Monitors</h3>
            <p className="text-sm text-gray-500 italic mt-1">MEDIRON Advance • MEDIRON Prime — Clinically validated, home &amp; clinic ready</p>
            <p className="text-sm text-gray-600 leading-relaxed mt-4">
              MEDIRON automatic upper-arm blood pressure monitors deliver convenient and reliable blood
              pressure measurement in clinical and home-care environments. The range is offered in two
              variants: MEDIRON Advance (MEDI 447) with a clear digital display, and MEDIRON Prime
              (MEDI-712) with a high-contrast display and colour-coded blood pressure level indicator.
              Both are backed by a 3-year warranty.
            </p>
            <h4 className="text-sm font-bold text-gray-900 mt-6">Key Features</h4>
            <FeatureList items={[
              'Hypertension indicator helps users interpret each reading at a glance.',
              'Body movement detection alerts the user when movement may affect accuracy.',
              'Irregular heartbeat detection flags possible pulse irregularities.',
              'Last memory recalls previous readings (Prime adds SET / MEM controls and multi-user memory).',
              'Dual power: 4 × AA batteries or Micro-USB cable.',
              'Clinically validated, CE marked, with a 3-year warranty.',
            ]} />
            <h4 className="text-sm font-bold text-gray-900 mt-6">Technical Specification — MEDIRON Advance (MEDI 447)</h4>
            <SpecTable rows={[
              ['Measurement method', 'Oscillometric method'],
              ['Pressure range', '0 – 280 mmHg'],
              ['Pulse range', '40 – 199 beats/min'],
              ['Accuracy', 'Pressure ±3 mmHg; Pulse ±5% of reading'],
              ['Battery life', 'Approx. 300 measurements'],
              ['Power source', '4 × AA alkaline (1.5V); Micro-USB (DC 5V / 500mA)'],
              ['Weight', 'Approx. 290 g (without batteries)'],
              ['Unit dimensions', '140 (W) × 110 (H) × 81 (L) mm'],
              ['Arm cuff size', 'Arm circumference 23 – 33 cm'],
              ['Package contents', 'Main unit, arm cuff, 4 × AA batteries, manual, USB cable, zipper bag'],
              ['Warranty', '3 years (Prime: specification sheet on request)'],
            ]} />
            <p className="text-xs text-gray-600 leading-relaxed mt-6">
              <strong>DGDA Certificate of Registration (Medical Device):</strong> Digital Blood Pressure
              Monitor (Class B), Reg. No. 72-9071-2024. Certificate models: KF-65A, KF-65B, KF-65D, 1 pc
              per box. Technology: Netherlands Technology. Registered representative: MediRight
              International Ltd, 105/1 Kakrail, Dhaka-1100. Issued: 16 May 2024, valid 5 years from issue.
            </p>
          </div>

          {/* 02 Glucose Meter */}
          <div className="card p-6 md:p-8 mb-6">
            <p className="text-[11px] font-bold text-brand-500 uppercase tracking-widest">02</p>
            <h3 className="text-xl font-bold text-gray-900 mt-1">Blood Glucose Meter</h3>
            <p className="text-sm text-gray-500 italic mt-1">MEDIRON Excellent Blood Glucose Meter — Accurate result in 5 seconds</p>
            <p className="text-sm text-gray-600 leading-relaxed mt-4">
              The MEDIRON Blood Glucose Monitoring System supports regular monitoring and diabetes-care
              requirements with European-designed technology. It needs an ultra-low 0.8 microlitre blood
              sample, requires no manual coding, and is complemented by a lifetime warranty.
            </p>
            <h4 className="text-sm font-bold text-gray-900 mt-6">Key Features</h4>
            <FeatureList items={[
              'Fast results: 5-second test time.',
              'Ultra-low sample: only 0.8 microlitre of blood.',
              '512-test memory with 7, 14 and 28-day averaging.',
              'Switchable units: mmol/L and mg/dL.',
              'Light indicator & strip ejection for easy, hygienic handling.',
              'AC/PC market: flags before-meal and after-meal readings.',
            ]} />
            <h4 className="text-sm font-bold text-gray-900 mt-6">Technical Specification</h4>
            <SpecTable rows={[
              ['Enzyme', 'GOD (Glucose Oxidase)'],
              ['ISO compliance', 'ISO 15197:2015'],
              ['Display', 'LCD'],
              ['Blood sample', '0.8 µl'],
              ['Measurement time', '5 seconds'],
              ['Measurement range', '1.1 – 33.3 mmol/L'],
              ['Memory capacity', '512 tests'],
              ['Averaging (days)', '7, 14, 28'],
              ['Unit of measurement', 'Switchable (mmol/L & mg/dL)'],
              ['Product size', '83.9 × 55.3 × 16.1 mm'],
              ['Battery / auto-off', '1 × button battery / 3 minutes'],
              ['Kit contents', 'Case, meter, lancing device, strips, lancets, manual'],
              ['Warranty', 'Lifetime'],
            ]} />
            <p className="text-xs text-gray-600 leading-relaxed mt-6">
              <strong>DGDA Certificate of Registration (Medical Device):</strong> Mediron Blood Glucose
              Monitoring System (Class C), Reg. No. 72-8880-2024. Certificate model: KF-A08, 1 pc per
              box. Technology: Netherlands Technology. Registered representative: MediRight International
              Ltd, 105/1 Kakrail, Dhaka-1100. Issued: 22 Feb 2024, valid 5 years from issue.
            </p>
          </div>

          {/* 03 Test Strips */}
          <div className="card p-6 md:p-8 mb-6">
            <p className="text-[11px] font-bold text-brand-500 uppercase tracking-widest">03</p>
            <h3 className="text-xl font-bold text-gray-900 mt-1">Blood Glucose Test Strips</h3>
            <p className="text-sm text-gray-500 italic mt-1">Electrochemical biosensor strips for MEDIRON meters — 50 and 100 strip packs</p>
            <p className="text-sm text-gray-600 leading-relaxed mt-4">
              MEDIRON Blood Glucose Test Strips are used with the compatible MEDIRON glucose meter to
              measure blood sugar levels. Using electrochemical biosensor technology, they deliver fast
              and accurate results from a small capillary blood sample, helping patients monitor and
              manage their glucose levels with confidence.
            </p>
            <h4 className="text-sm font-bold text-gray-900 mt-6">Key Features</h4>
            <FeatureList items={[
              'Auto-coded: no manual coding required.',
              '5-second result: fast and accurate.',
              'Small sample: fresh capillary whole blood.',
              'Flexible pack sizes: 25 × 2 (50) and 50 × 2 (100) vials.',
            ]} />
            <h4 className="text-sm font-bold text-gray-900 mt-6">Technical Specification</h4>
            <SpecTable rows={[
              ['Test type', 'Blood glucose monitoring'],
              ['Technology', 'Electrochemical biosensor'],
              ['Sample type', 'Fresh capillary whole blood (small sample)'],
              ['Compatibility', 'MEDIRON Blood Glucose Meter only'],
              ['Measurement unit', 'mg/dL'],
              ['Test time', 'Within 5 seconds'],
              ['Calibration', 'Auto-coded / no manual coding'],
              ['Pack sizes', '50 strips (2 vials of 25); 100 strips (2 vials of 50)'],
              ['Certification', 'CE certified'],
              ['Storage', 'Cool, dry place — do not refrigerate'],
            ]} />
            <p className="text-xs text-gray-600 leading-relaxed mt-6">
              <strong>DGDA Certificate of Registration (Medical Device):</strong> Mediron Blood Glucose
              Test Strips (Class C), Reg. No. 72-8881-2024. Certificate models: KF-A01, KF-A01-C. Pack
              sizes: 25×2 = 50; 50×2 = 100; 50 single foil strips. Technology: Netherlands Technology.
              Registered representative: MediRight International Ltd, 105/1 Kakrail, Dhaka-1100. Issued:
              22 Feb 2024, valid 5 years from issue.
            </p>
          </div>

          {/* 04 Lancets */}
          <div className="card p-6 md:p-8 mb-6">
            <p className="text-[11px] font-bold text-brand-500 uppercase tracking-widest">04</p>
            <h3 className="text-xl font-bold text-gray-900 mt-1">Blood Lancets — Twist Type</h3>
            <p className="text-sm text-gray-500 italic mt-1">Sterile, single-use 31G lancets for gentle, safe blood sampling</p>
            <p className="text-sm text-gray-600 leading-relaxed mt-4">
              MEDIRON Twist-Type Blood Lancets are sterile, single-use devices designed to make a small
              puncture in the fingertip for blood sampling. Commonly used for glucose testing, they use a
              medical-grade stainless steel needle and a protective twist-off cap to minimize pain and
              skin trauma.
            </p>
            <h4 className="text-sm font-bold text-gray-900 mt-6">Key Features</h4>
            <FeatureList items={[
              'Fine 31G needle minimizes pain and skin trauma.',
              'Protective twist-off cap keeps the needle sterile until use.',
              'Universal fit: compatible with most standard lancing devices.',
              'Versatile use: home, clinic, hospital and diagnostic centre.',
            ]} />
            <h4 className="text-sm font-bold text-gray-900 mt-6">Technical Specification</h4>
            <SpecTable rows={[
              ['Type', 'Twist type'],
              ['Gauge size', '31G'],
              ['Sterilization', 'Sterilized (single use)'],
              ['Material', 'Medical-grade stainless steel needle'],
              ['Usage', 'Blood sampling for glucose testing'],
              ['Compatibility', 'Most standard lancing devices'],
              ['Certification', 'CE 0197'],
              ['Quantity per box', '100 pcs'],
              ['Packaging', 'Box packed, hygienic and sealed'],
            ]} />
            <p className="text-xs text-gray-600 leading-relaxed mt-6">
              <strong>DGDA Certificate of Registration (Medical Device):</strong> Mediron Blood Lancet
              (Class B), Reg. No. 72-8840-2023. Certificate models: 30G, 31G, 32G, 50 &amp; 100 pcs per
              box. Technology: Netherlands Technology. Registered representative: MediRight International
              Ltd, 105/1 Kakrail, Dhaka-1100. Validity: 5 years from issue.
            </p>
          </div>

          {/* 05 Nebulizer */}
          <div className="card p-6 md:p-8 mb-6">
            <p className="text-[11px] font-bold text-brand-500 uppercase tracking-widest">05</p>
            <h3 className="text-xl font-bold text-gray-900 mt-1">Compressor Nebulizer</h3>
            <p className="text-sm text-gray-500 italic mt-1">MEDIRON MED-1240 — Powerful piston compressor, quiet and portable</p>
            <p className="text-sm text-gray-600 leading-relaxed mt-4">
              The MEDIRON Compressor Nebulizer converts liquid medication into a fine mist for inhalation.
              It is commonly used to deliver respiratory medicines to patients with asthma, COPD, and
              other breathing conditions, and is backed by a 3-year warranty.
            </p>
            <h4 className="text-sm font-bold text-gray-900 mt-6">Key Features</h4>
            <FeatureList items={[
              'Strong air flow: powerful piston compressor.',
              'Low noise: sound level ≤ 65 dB(A).',
              'Easy operation: easy handle and cleaning, simple for home use.',
              'Portable: compact 1.5 kg unit with built-in nebulizer holder.',
            ]} />
            <h4 className="text-sm font-bold text-gray-900 mt-6">Technical Specification</h4>
            <SpecTable rows={[
              ['Model', 'MED-1240'],
              ['Liter flow range', '≥ 5 L/min'],
              ['Average nebulization rate', '≥ 0.25 mL/min'],
              ['Sound level', '≤ 65 dB(A)'],
              ['Particle size', '3 micrometre ± 25%'],
              ['Operating humidity', '15 – 80% RH'],
              ['Operating pressure', '9 – 21 psi'],
              ['Compressor pressure', '30 – 45 psi'],
              ['Product size', '276 × 174.5 × 121 mm'],
              ['Unit weight', '1.5 kg'],
              ['Use life', '5 years'],
              ['Warranty', '3 years'],
            ]} />
            <p className="text-xs text-gray-600 leading-relaxed mt-6">
              <strong>DGDA Certificate of Registration (Medical Device):</strong> Compressor Nebulizer
              (Class B), Reg. No. 72-9070-2024. Certificate models: KF-WHQ-03, KF-WHQ-07, 1 pc per box.
              Technology: Netherlands Technology. Registered representative: MediRight International Ltd,
              105/1 Kakrail, Dhaka-1100. Issued: 16 May 2024, valid 5 years from issue.
            </p>
          </div>

          {/* 06 Gloves */}
          <div className="card p-6 md:p-8 mb-6">
            <p className="text-[11px] font-bold text-brand-500 uppercase tracking-widest">06</p>
            <h3 className="text-xl font-bold text-gray-900 mt-1">Examination Gloves</h3>
            <p className="text-sm text-gray-500 italic mt-1">MEDIRON — Your Partner in Protection</p>
            <p className="text-sm text-gray-600 leading-relaxed mt-4">
              MEDIRON Examination Gloves are disposable gloves that provide a protective barrier during
              medical examinations and routine healthcare procedures. They help reduce the risk of
              contamination and protect both healthcare workers and patients.
            </p>
            <h4 className="text-sm font-bold text-gray-900 mt-6">Key Features</h4>
            <FeatureList items={[
              'Natural rubber (NR) latex: flexible, comfortable fit.',
              'CE 0086 marked with EN 374 (micro-organism, chemical) and EN 388 (mechanical) pictograms.',
              'Clear labelling: batch, manufacturing and expiry dates printed on the pack.',
            ]} />
            <h4 className="text-sm font-bold text-gray-900 mt-6">Technical Specification</h4>
            <SpecTable rows={[
              ['Product', 'Examination gloves'],
              ['Material', 'NR latex'],
              ['Finish', 'Powdered'],
              ['Sterility', 'Non-sterile'],
              ['Certification marks', 'CE 0086; BS EN 374; BS EN 388:2003'],
              ['Country of origin', 'Malaysia'],
              ['Caution', 'Contains natural rubber latex — may cause allergic reactions in sensitized individuals'],
            ]} />
          </div>

          {/* 07 Extended Portfolio */}
          <div className="card p-6 md:p-8">
            <p className="text-[11px] font-bold text-brand-500 uppercase tracking-widest">07</p>
            <h3 className="text-xl font-bold text-gray-900 mt-1">Extended Portfolio</h3>
            <p className="text-sm text-gray-500 italic mt-1">Thermometers • Monitoring equipment • Healthcare • Cosmetics &amp; personal care</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="card p-5">
                <h4 className="text-sm font-bold text-gray-900">Medical Thermometers</h4>
                <p className="text-xs text-gray-500 leading-relaxed mt-2">Digital medical thermometers designed to measure body temperature accurately and provide fast, convenient, and user-friendly temperature monitoring. Commonly used in hospitals, clinics, and homes to detect fever and monitor temperature.</p>
              </div>
              <div className="card p-5">
                <h4 className="text-sm font-bold text-gray-900">Other Medical Monitoring Equipment</h4>
                <p className="text-xs text-gray-500 leading-relaxed mt-2">A growing range of healthcare and medical monitoring products selected to meet the requirements of healthcare professionals, institutions, retailers, and individual users.</p>
              </div>
              <div className="card p-5">
                <h4 className="text-sm font-bold text-gray-900">Healthcare Products</h4>
                <p className="text-xs text-gray-500 leading-relaxed mt-2">Products selected to support personal wellness, home care, institutional requirements, and everyday health-management needs.</p>
              </div>
              <div className="card p-5">
                <h4 className="text-sm font-bold text-gray-900">Cosmetics &amp; Personal Care</h4>
                <p className="text-xs text-gray-500 leading-relaxed mt-2">Nationwide marketing and distribution of premium, authentic, and quality-certified cosmetic and personal care products, carefully selected from renowned international brands and established manufacturers, with emphasis on authenticity, quality, safety, and customer satisfaction. The cosmetics portfolio primarily features natural and premium beauty and personal care products sourced from leading markets, including Thailand, South Korea, the United States, and the United Kingdom.</p>
              </div>
            </div>
            <p className="text-center text-xs font-bold text-brand-500 uppercase tracking-widest mt-8">Authentic Products • International Quality • Trusted Brands • Nationwide Distribution</p>
          </div>
        </div>
      </section>

      {/* Quality, Compliance & Certification */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <SectionHeader title="Quality, Compliance & Certification" />
        <p className="text-sm text-gray-600 leading-relaxed max-w-3xl mx-auto text-center">
          MMS Prime selects and promotes products with close attention to applicable quality, safety,
          and regulatory requirements. The core MEDIRON® medical devices are registered with the
          Directorate General of Drug Administration (DGDA), Ministry of Health &amp; Family Welfare,
          Government of the People&apos;s Republic of Bangladesh, under the Drugs Act 1940 and the Drugs
          (Control) Ordinance 1982. Each registration is valid for five years from the date of issue.
        </p>
        <h3 className="text-sm font-bold text-gray-900 mt-10 mb-4 text-center">DGDA Medical Device Registrations</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>DGDA Reg. No.</th>
                <th>Class</th>
                <th>Model No.</th>
                <th>Technology</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="font-semibold text-gray-900">Blood Glucose Monitoring System</td><td>72-8880-2024</td><td>C</td><td>KF-A08</td><td>Netherlands Technology</td></tr>
              <tr><td className="font-semibold text-gray-900">Blood Glucose Test Strips</td><td>72-8881-2024</td><td>C</td><td>KF-A01, KF-A01-C</td><td>Netherlands Technology</td></tr>
              <tr><td className="font-semibold text-gray-900">Blood Lancet</td><td>72-8840-2023</td><td>B</td><td>30G, 31G, 32G</td><td>Netherlands Technology</td></tr>
              <tr><td className="font-semibold text-gray-900">Digital Blood Pressure Monitor</td><td>72-9071-2024</td><td>B</td><td>KF-65A, KF-65B, KF-65D</td><td>Netherlands Technology</td></tr>
              <tr><td className="font-semibold text-gray-900">Compressor Nebulizer</td><td>72-9070-2024</td><td>B</td><td>KF-WHQ-03, KF-WHQ-07</td><td>Netherlands Technology</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 italic text-center mt-4">
          Registrations are held through the authorized representative MediRight International Ltd,
          105/1 Kakrail, Dhaka-1100, Bangladesh.
        </p>
        <h3 className="text-sm font-bold text-gray-900 mt-10 mb-4 text-center">International Quality Framework</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="card p-5">
            <h4 className="text-sm font-bold text-gray-900">ISO 13485</h4>
            <p className="text-xs text-gray-500 leading-relaxed mt-2">Where applicable, manufactured in accordance with ISO 13485 quality-management requirements.</p>
          </div>
          <div className="card p-5">
            <h4 className="text-sm font-bold text-gray-900">CE Marking</h4>
            <p className="text-xs text-gray-500 leading-relaxed mt-2">On applicable devices (e.g., CE 0123 on monitors, CE 0197 on lancets, CE 0086 on gloves).</p>
          </div>
          <div className="card p-5">
            <h4 className="text-sm font-bold text-gray-900">ISO 15197:2015</h4>
            <p className="text-xs text-gray-500 leading-relaxed mt-2">Blood glucose meter conforms to ISO 15197:2015 accuracy requirements.</p>
          </div>
          <div className="card p-5">
            <h4 className="text-sm font-bold text-gray-900">EC REP</h4>
            <p className="text-xs text-gray-500 leading-relaxed mt-2">SUNGO Europe B.V., Olympisch Stadion 24, 1076 DE Amsterdam, Netherlands, where applicable.</p>
          </div>
          <div className="card p-5">
            <h4 className="text-sm font-bold text-gray-900">TÜV</h4>
            <p className="text-xs text-gray-500 leading-relaxed mt-2">Applicable TÜV certification, according to the specific product and certification scope.</p>
          </div>
        </div>
      </section>

      {/* Distribution & Market Reach */}
      <section className="bg-surface-50 border-y border-gray-100 py-14">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHeader title="Distribution & Market Reach" subtitle="An efficient distribution network throughout Bangladesh" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="card card-hover p-5">
              <h3 className="text-sm font-bold text-gray-900">Healthcare Institutions</h3>
              <p className="text-xs text-gray-500 leading-relaxed mt-2">Hospitals, clinics, diagnostic centers, pharmacies, healthcare organizations, and other medical institutions.</p>
            </div>
            <div className="card card-hover p-5">
              <h3 className="text-sm font-bold text-gray-900">Pharmacy &amp; Retail Network</h3>
              <p className="text-xs text-gray-500 leading-relaxed mt-2">Pharmacies, medical stores, healthcare retailers, cosmetic retailers, authorized dealers, and distribution partners.</p>
            </div>
            <div className="card card-hover p-5">
              <h3 className="text-sm font-bold text-gray-900">Corporate &amp; Institutional Clients</h3>
              <p className="text-xs text-gray-500 leading-relaxed mt-2">Organizations, industrial facilities, corporate healthcare programs, educational institutions, government and non-government organizations, and institutional buyers.</p>
            </div>
            <div className="card card-hover p-5">
              <h3 className="text-sm font-bold text-gray-900">Home Healthcare Market</h3>
              <p className="text-xs text-gray-500 leading-relaxed mt-2">Consumers and families seeking convenient medical monitoring, healthcare, personal-care, and cosmetic products for everyday use.</p>
            </div>
            <div className="card card-hover p-5">
              <h3 className="text-sm font-bold text-gray-900">Telemarketing &amp; Online Sales</h3>
              <p className="text-xs text-gray-500 leading-relaxed mt-2">Dedicated telemarketing and online sales units supporting product promotion, customer communication, order processing, and market coverage throughout Bangladesh.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Commitment */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <SectionHeader title="Our Commitment" subtitle="Quality, reliability, accessibility, and responsible customer support" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {[
            'Import and distribute quality healthcare, medical, and cosmetic products in Bangladesh.',
            'Promote reliable medical equipment and healthcare solutions.',
            'Develop and maintain an efficient nationwide distribution network.',
            'Expand market access through retail, institutional, telemarketing, and online channels.',
            'Maintain professional relationships with clients, dealers, retailers, and business partners.',
            'Provide appropriate product information and user guidance.',
            'Support customers with responsive after-sales service.',
            'Build long-term partnerships with healthcare institutions and commercial organizations.',
            'Conduct business responsibly and in accordance with applicable requirements.',
          ].map((item, i) => (
            <div key={i} className="card card-hover p-5">
              <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Partner */}
      <section className="bg-surface-50 border-y border-gray-100 py-14">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHeader title="Why Partner With MMS Prime?" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ['01', 'Nationwide Market Access', 'A broad and growing network of institutions, pharmacies, retailers, dealers, corporates, and consumers across Bangladesh.'],
              ['02', 'Integrated Sales Channels', 'Institutional sales, retail distribution, dealer networks, telemarketing, and online sales for wider availability.'],
              ['03', 'Local Market Knowledge', "Practical understanding of Bangladesh's healthcare, medical-equipment, personal-care, and cosmetic markets."],
              ['04', 'Professional Brand Representation', 'Structured marketing and market-representation support for MEDIRON® and other selected product lines.'],
              ['05', 'End-to-End Commercial Support', 'Import coordination, product introduction, order processing, distribution, and after-sales support.'],
              ['06', 'Faster, Convenient Customer Access', 'Distribution, telemarketing, and online capabilities help customers find and purchase products easily.'],
              ['07', 'Quality & Compliance Focus', 'DGDA-registered devices and products selected with attention to quality, safety, and regulatory requirements.'],
              ['08', 'Responsive Service', 'Clear communication, timely order coordination, product information, and practical follow-through.'],
              ['09', 'Scalable Partnerships', 'Institutional supply, retail distribution, dealer development, corporate programs, campaigns, and online sales.'],
              ['10', 'Long-Term Business Focus', 'Sustainable relationships built on reliability, transparency, service quality, and mutual growth.'],
            ].map(([num, title, desc]) => (
              <div key={num} className="card card-hover p-5 flex gap-4">
                <span className="font-brandname text-2xl font-bold text-brand-500 flex-shrink-0">{num}</span>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mt-1.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Corporate Information */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <SectionHeader title="Corporate Information" />
        <div className="table-container max-w-3xl mx-auto">
          <table className="data-table">
            <tbody>
              <tr><td className="font-semibold text-gray-900 w-44">Company</td><td>MMS Prime</td></tr>
              <tr><td className="font-semibold text-gray-900">Business</td><td>Importer and Distributor of Healthcare, Medical Equipment, and Cosmetic Products</td></tr>
              <tr><td className="font-semibold text-gray-900">Brand Represented</td><td>MEDIRON® | MEDIRONTM | NEW Upcoming Products</td></tr>
              <tr><td className="font-semibold text-gray-900">Market</td><td>Bangladesh</td></tr>
              <tr><td className="font-semibold text-gray-900">Position</td><td>Nationwide Distributor and Marketer of MEDIRON® Medical Equipment</td></tr>
              <tr><td className="font-semibold text-gray-900">Head Office</td><td>23, Shahid Captain Monsur Ali Sharani (2nd floor), Ramna, Dhaka-1217</td></tr>
              <tr><td className="font-semibold text-gray-900">Mobile</td><td>+880 13 55 9 44 8 66 (Office) | +880 17 90 60 60 57 | +880 18 18 27 64 24</td></tr>
              <tr><td className="font-semibold text-gray-900">E-mail</td><td>mmsprimebd@gmail.com</td></tr>
              <tr><td className="font-semibold text-gray-900">Website</td><td>www.mmsprime.bd</td></tr>
              <tr><td className="font-semibold text-gray-900">Facebook</td><td>facebook.com/mmsprime26</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-center font-tagline text-2xl text-gray-900 italic mt-10">Let&apos;s build a healthier Bangladesh together.</p>
        <div className="text-center mt-8">
          <a href="/company-profile.pdf" target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex">
            <MdDownload size={16} /> Download Profile (PDF)
          </a>
        </div>
      </section>

      {/* DGDA Certificates */}
      <section className="bg-surface-50 border-t border-gray-100 py-14">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHeader
            title="DGDA Certificates of Registration"
            subtitle="Copies of the medical device registration certificates issued by the Directorate General of Drug Administration (DGDA), Government of Bangladesh. Original certificates are available on request."
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(n => (
              <a key={n} href={`/certificates/cert-${n}.jpg`} target="_blank" rel="noopener noreferrer" className="card card-hover overflow-hidden group text-left">
                <div className="aspect-[3/4] bg-gray-50 overflow-hidden">
                  <img src={`/certificates/cert-${n}-thumb.jpg`} alt={`Certificate ${n}`} className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform" loading="lazy" />
                </div>
                <div className="p-3">
                  <span className="text-[11px] font-semibold text-gray-700">Certificate {n}</span>
                </div>
              </a>
            ))}
          </div>
          <div className="text-center mt-8">
            <a href="/certificates/mediron-certificates.pdf" target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex text-sm">
              <MdDownload size={16} /> Download all certificates (PDF)
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="font-logo text-base leading-none text-white select-none tracking-[-0.09em]">mms.</span>
            </div>
            <span className="font-brandname text-sm font-bold text-white uppercase tracking-wide">MMS Prime</span>
          </div>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} MMS Prime. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
