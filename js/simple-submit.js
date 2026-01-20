console.log('=== Script carregado ===');
// ===== TRADUÇÕES - RUSSIAN =====
var MENSAGENS = {
    nomeInvalido: 'Пожалуйста, введите ваше имя',
    telefoneInvalido: 'Пожалуйста, введите правильный номер телефона',
    enviando: 'Отправка...',
    botaoEnviar: 'Заказать', // Texto original do botão
    erro: 'Ошибка',
    erroEnvio: 'Ошибка отправки'
};
// =====================================================
// Flag to prevent double submission logic if needed
var ABD_SENT = false;

// Helper to extract data
function getFormData(form) {
    var formData = {};
    var inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(function (input) {
        if (input.name && input.value) {
            formData[input.name] = input.value;
        }
    });

    var urlParams = new URLSearchParams(window.location.search);
    ['gclid', 'web_id', 'sub1', 'sub2', 'sub3', 'sub4', 'sub5', 'utm_source', 'utm_medium', 'utm_campaign'].forEach(function (param) {
        var val = urlParams.get(param);
        if (val) formData[param] = val;
    });

    if (formData.gclid && !formData.sub1) {
        formData.sub1 = formData.gclid;
    }
    return formData;
}

function sendAbandonedData() {
    if (ABD_SENT) return; // Already sent

    // Find the first form with valid data
    var forms = document.querySelectorAll('form');
    var targetForm = null;
    var validData = null;

    forms.forEach(function (form) {
        if (targetForm) return;
        var name = form.querySelector('[name="name"]');
        var phone = form.querySelector('[name="phone"]');

        if (name && phone && name.value.trim().length >= 2 && phone.value.trim().length >= 8) {
            targetForm = form;
            validData = getFormData(form);
        }
    });

    if (validData) {
        console.log('👻 Detectado abandono com dados válidos! Enviando...', validData);
        ABD_SENT = true;
        validData.comments = (validData.comments || '') + ' [Auto-Recovered / Abandoned]';

        // Use keepalive to allow request to complete even if tab closes
        fetch('/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validData),
            keepalive: true
        }).catch(e => console.error('Erro no envio abandonado', e));
    }
}

// Triggers for abandonment
document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
        sendAbandonedData();
    }
});

// For mobile usage and page closing
window.addEventListener('pagehide', sendAbandonedData);


function processSubmit(form) {
    console.log('📝 Processando envio!');
    ABD_SENT = true; // Mark as sent so we don't send abandoned trigger after manual submit

    var nameInput = form.querySelector('[name="name"]');
    var phoneInput = form.querySelector('[name="phone"]');

    var name = nameInput ? nameInput.value.trim() : '';
    var phone = phoneInput ? phoneInput.value.trim() : '';

    console.log('Nome:', name);
    console.log('Telefone:', phone);

    if (!name || name.length < 2) {
        alert(MENSAGENS.nomeInvalido);
        ABD_SENT = false; // Reset if invalid
        return;
    }

    if (!phone || phone.length < 8) {
        alert(MENSAGENS.telefoneInvalido);
        ABD_SENT = false; // Reset if invalid
        return;
    }

    console.log('✅ Validação OK!');

    var btn = form.querySelector('button[type="submit"]');
    if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.textContent = MENSAGENS.enviando;
    }

    var formData = getFormData(form);

    console.log('📤 Enviando para API:', formData);

    fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
        .then(function (response) {
            console.log('📡 Resposta recebida! Status:', response.status);
            if (!response.ok) {
                return response.text().then(function (text) {
                    throw new Error('HTTP ' + response.status + ': ' + text);
                });
            }
            return response.json();
        })
        .then(function (data) {
            console.log('✅ Resposta da API:', data);
            if (data.success) {
                console.log('🎉 Sucesso! Redirecionando...');
                window.location.href = '/?status=success';
            } else {
                alert(MENSAGENS.erro + ': ' + (data.error || 'Unknown error'));
                if (btn) {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.textContent = MENSAGENS.botaoEnviar;
                }
            }
        })
        .catch(function (error) {
            console.error('❌ Erro:', error);
            alert(MENSAGENS.erroEnvio + ': ' + error.message);
            if (btn) {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.textContent = MENSAGENS.botaoEnviar;
            }
        });
}
function initForm() {
    console.log('🔧 Iniciando configuração...');

    var forms = document.querySelectorAll('form');
    console.log('📋 Encontrados ' + forms.length + ' formulários');

    if (forms.length === 0) {
        console.warn('⚠️ Nenhum formulário encontrado ainda. Tentando novamente...');
        setTimeout(initForm, 500);
        return;
    }

    forms.forEach(function (form, index) {
        console.log('⚙️ Configurando formulário #' + index);

        form.addEventListener('submit', function (e) {
            console.log('🎯 Submit event capturado!');
            e.preventDefault();
            e.stopImmediatePropagation();
            processSubmit(form);
        }, true);

        var buttons = form.querySelectorAll('button[type="submit"]');
        buttons.forEach(function (btn) {
            console.log('🔘 Adicionando listener no botão');
            btn.addEventListener('click', function (e) {
                console.log('🖱️ Botão clicado!');
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                processSubmit(form);
            }, true);
        });
    });

    console.log('✅ Configuração concluída!');
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForm);
} else {
    initForm();
}
window.addEventListener('load', function () {
    console.log('🌐 Window.load disparado...');
    setTimeout(initForm, 100);
});
