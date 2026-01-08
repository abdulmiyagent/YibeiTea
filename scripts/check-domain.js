const whois = require('whois');

const domains = process.argv.slice(2);

if (domains.length === 0) {
  console.log('Gebruik: node scripts/check-domain.js domein1.com domein2.nl ...');
  process.exit(1);
}

domains.forEach(domain => {
  console.log(`\n🔍 Checking: ${domain}`);
  console.log('─'.repeat(40));

  whois.lookup(domain, (err, data) => {
    if (err) {
      console.log(`❌ Error: ${err.message}`);
      return;
    }

    const isAvailable = data.toLowerCase().includes('no match') ||
                        data.toLowerCase().includes('not found') ||
                        data.toLowerCase().includes('no data found');

    if (isAvailable) {
      console.log(`✅ ${domain} - BESCHIKBAAR!`);
    } else {
      console.log(`❌ ${domain} - Bezet`);
      // Toon registratiedatum als beschikbaar
      const createdMatch = data.match(/Creat.*?:\s*(.+)/i);
      if (createdMatch) {
        console.log(`   Geregistreerd: ${createdMatch[1]}`);
      }
    }
  });
});
