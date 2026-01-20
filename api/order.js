export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  // ===== CONFIGURAÇÕES - SUBSTITUA AQUI =====
  const API_KEY = 'skuVwANNCTIUTecoOWbUh6Ck1bSUAgJEnNb3Wvxb6';
  const OFFER_ID = '6610';
  const STREAM_ID = '86yFNmPe';
  const COUNTRY_CODE = 'UZ'; // Ex: MX, BR, ES
  // ==========================================
  const API_URL = 'http://api.cpa.tl/api/lead/send';
  try {
    const body = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const apiData = new URLSearchParams();
    apiData.append('key', API_KEY);
    apiData.append('id', Date.now().toString());
    apiData.append('offer_id', OFFER_ID);
    apiData.append('stream_hid', STREAM_ID);
    apiData.append('name', body.name || '');
    apiData.append('phone', body.phone || '');
    apiData.append('comments', body.comments || '');
    apiData.append('country', COUNTRY_CODE);
    apiData.append('address', body.address || '');
    apiData.append('tz', body.timezone_int || '3');
    apiData.append('web_id', body.web_id || '');
    apiData.append('ip_address', ip);
    apiData.append('user_agent', userAgent);
    const optionalFields = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
      'sub1', 'sub2', 'sub3', 'sub4', 'sub5', 'sub1024'
    ];
    optionalFields.forEach(field => {
      if (body[field]) apiData.append(field, body[field]);
    });
    console.log('Sending to Traffic Light:', Object.fromEntries(apiData));
    const response = await fetch(API_URL, {
      method: 'POST',
      body: apiData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const responseText = await response.text();
    console.log('Traffic Light Response:', responseText);
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response', e);
      res.status(500).json({ error: 'Invalid response from affiliate network', raw: responseText });
      return;
    }
    if (response.ok && !result.error && !result.errmsg) {
      res.status(200).json({ success: true, data: result });
    } else {
      res.status(400).json({
        error: result.error || result.errmsg || 'Unknown error',
        details: result
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
