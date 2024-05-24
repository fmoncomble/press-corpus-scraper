console.log('Button injection loaded');
const copyBtn = document.createElement('span');
copyBtn.classList.add('btn');
copyBtn.classList.add('btn-primary');
copyBtn.style.marginRight = '15px';
copyBtn.textContent = 'Copy API key';
const deleteBtn = document.getElementById('apikey-delete');
deleteBtn.before(copyBtn);

copyBtn.addEventListener('click', () => {
    const apiInput = document.querySelector('input.apikey-input');
    const apiKey = apiInput.value;
    copyApiKey(apiKey);
});

function copyApiKey(apiKey) {
    copyBtn.style.backgroundColor = 'green';
    copyBtn.style.borderColor = 'green';
    const textarea = document.createElement('textarea');
    textarea.value = apiKey;

    textarea.select();

    try {
        navigator.clipboard
            .writeText(textarea.value)
            .then(() => {
                console.log('Text copied to clipboard:', apiKey);
            })
            .catch((err) => {
                console.error('Failed to copy text to clipboard:', err);
            });
    } catch (err) {
        console.error('Clipboard write operation not supported:', err);
    }
    setTimeout(() => {
        copyBtn.removeAttribute('style');
        window.close();
    }, 1000);
}