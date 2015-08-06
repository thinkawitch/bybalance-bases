

function ServiceLife(data)
{
    var url = 'https://issa.life.com.by/';
    var result = prepareResult();
    var paramMiddlewareToken = '';
    var rm = new RequestMediator();

    function auth1()
    {
        log('life auth1');
        return new Promise(function(resolve, reject)
        {
            rm.doGet(url + '/ru/')
                .then(function(response) {
                    resolve(response.data);
                })
                .catch(reject);
        });
    }

    function getParamMiddlewareToken(html)
    {
        var i, regexp, matches;
        var tokenMarkers = [
            /name="csrfmiddlewaretoken" value="([^"]+)"/mi,
            /name='csrfmiddlewaretoken' value='([^']+)'/mi
        ];

        for (i=0; i<tokenMarkers.length; i++)
        {
            regexp = tokenMarkers[i];
            matches = html.match(regexp);
            log(regexp, matches);
            if (matches && matches.length == 2)
            {
                return String(matches[1]).trim();
            }
        }

        return '';
    }

    function auth2(html)
    {
        log('life auth2');
        return new Promise(function(resolve, reject)
        {
            paramMiddlewareToken = getParamMiddlewareToken(html);
            log('paramMiddlewareToken', paramMiddlewareToken);
            if (paramMiddlewareToken == '')
            {
                reject();
                return;
            }

            var fields = {
                csrfmiddlewaretoken: paramMiddlewareToken,
                msisdn_code: data.username.substr(0, 2),
                msisdn: data.username.substr(2),
                super_password: data.password,
                form: 'true',
                next: '/'
            };
            rm.doPost(url + '/ru/', fields, {referer: url + '/ru/'})
                .then(function(response) {
                    resolve(response.data);
                })
                .catch(reject);
        });
    }

    function authorize()
    {
        log('life authorize');
        return new Promise(function(resolve, reject)
        {
            auth1().then(auth2).then(resolve).catch(reject);
        });
    }

    function extractBasic(html)
    {
        log('life extractBasic');
        //$('#idResponse').val(html);

        if (html.indexOf('class="log-out"') == -1)
        {
            result.incorrectLogin = true;
            //return;
            throw 'incorrect_login';
        }

        var i, regexp, matches;
        var balanceMarkers = [
            /Основной баланс\s*<\/td>\s*<td[^>]*>([^<]+)руб/mi,
            /Основной счет\s*<\/td>\s*<td[^>]*>([^<]+)руб/mi
        ];

        for (i=0; i<balanceMarkers.length; i++)
        {
            regexp = balanceMarkers[i];
            matches = html.match(regexp);
            log(regexp, matches);
            if (matches && matches.length == 2)
            {
                result.extracted = true;
                result.balance = getIntegerNumber(matches[1]);
                break;
            }
        }
    }

    function process()
    {
        return new Promise(function(resolve)
        {
            var last = function() { resolve(result) };

            authorize()
                .then(extractBasic)
                    .then(last)
            .catch(last);
        });
    }

    return {process: process};
}