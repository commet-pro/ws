/* Set the verified Commet WhatsApp number, with country and area codes. */
window.CommetContact = {
  whatsapp: '5514991796593',
  open(message) {
    const pt = (document.documentElement.lang || '').startsWith('pt');
    const number = this.whatsapp.replace(/\D/g, '');
    if (!/^55\d{10,11}$/.test(number) || number === '5511999999999') {
      window.alert(pt
        ? 'O WhatsApp comercial está sendo atualizado. Sua mensagem continua no formulário; tente novamente em breve.'
        : 'Our business WhatsApp is being updated. Your message remains in the form; please try again shortly.');
      return false;
    }
    // Called during the click, before any await, so browsers do not block the new tab.
    const popup = window.open('https://wa.me/' + number + '?text=' + encodeURIComponent(message), '_blank');
    if (!popup) {
      window.alert(pt ? 'Permita abrir o WhatsApp e tente novamente. Sua mensagem foi mantida.' : 'Allow WhatsApp to open and try again. Your message has been kept.');
      return false;
    }
    popup.opener = null;
    return true;
  }
};
