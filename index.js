var YaTestTask = angular.module('YaTestTask', []);

YaTestTask.controller('FormController', function ($scope, $q, $http, $timeout) {

    $scope.form = {
        fio: {
            placeholder: 'ФИО',
            type: 'text',
            pattern: '(\\D{1,}\\s{1,}){2}\\D{1,}',
            isValid: true,
            inputErrorText: 'ФИО - три слова через пробел, без цифр и спец символов',
            requiredErrorText: 'Пожалуйста, введите ФИО',
            value: ''
        },
        email: {
            placeholder: 'Email',
            type: 'email',
            pattern: '',
            isValid: true,
            inputErrorText: 'Проверьте ввод почты',
            requiredErrorText: 'Пожалуйста, введите email',
            value: ''
        },
        phone: {
            placeholder: 'Phone number',
            type: 'tel',
            pattern: '\\+\\d\\(\\d{3}\\)\\d{3}-\\d{2}-\\d{2}',
            isValid: true,
            inputErrorText: 'Формат номера телефона +7(___)___-__-__',
            requiredErrorText: 'Пожалуйста, введите номер телефона',
            value: '+7'
        }
    };

    $scope.focusInput = function (field) {
        $scope.form[field].isValid = true;
    };

    $scope.isWaitingResp = false;
    $scope.url = 'responses/success.json';
    $scope.statusClarify = [];
    $scope.status = '';
    $scope.MyForm = {
        validate: function () {
            var isValid = false,
                errorFields = [];
            for (var field in $scope.form) {
                if ($scope.yaTestForm.hasOwnProperty(field)) {
                    if ($scope.yaTestForm[field].$error.required ||
                        $scope.yaTestForm[field].$error.pattern ||
                        $scope.yaTestForm[field].$error.email) {

                        errorFields.push(field);
                        $scope.form[field].isValid = false;
                    }
                }

                if (field === 'fio') {
                    if (errorFields.indexOf('fio') === -1) {
                        if (!_onlyFreeWord($scope.form[field].value)) {
                            errorFields.push(field + ':  проверьте ввод ФИО');
                            $scope.form[field].isValid = false;
                        }
                    }
                    
                }

                if (field === 'email') {
                    if (errorFields.indexOf('email') === -1) {
                        var email = $scope.form[field].value,
                            validEmailDomains = ['ya.ru', 'yandex.ru', 'yandex.ua', 'yandex.by', 'yandex.kz', 'yandex.com'],
                            userDomain = email.slice(email.indexOf('@') + 1, email.length);

                        if (validEmailDomains.indexOf(userDomain) === -1) {
                            errorFields.push(field + ':  почтовый адрес не Yandex');
                            $scope.form[field].isValid = false;
                        }
                    }
                }

                if (field === 'phone') {
                    if ($scope.form[field].value) {
                        var maxSumForPhoneN = 30;
                        if ($scope.form[field].value.indexOf('+7') === -1) {
                            errorFields.push(field + ':  только русские номера на +7');
                            $scope.form[field].isValid = false;
                        } else if (!_isGoodSumPhoneNumber($scope.form[field].value, maxSumForPhoneN)) {
                            errorFields.push(field + ':  сумма номера более ' + maxSumForPhoneN);
                            $scope.form[field].isValid = false;
                        }
                    }
                }
            }
            if (errorFields.length === 0) {
                isValid = true;
            }
            return {isValid: isValid, errorFields: errorFields}
        },
        getData: function () {
            var data = {};
            for (var field in $scope.form) {
                data[field] = angular.copy($scope.form[field].value);
                data[field] = data[field] !== undefined ? data[field] : '';
            }
            return data;
        },
        setData: function (data) {
            for (var key in data) {
                if ($scope.form.hasOwnProperty(key)) {
                    $scope.form[key].value = angular.copy(data[key]);
                    $scope.form[key].isValid = true;
                }
            }
        },
        submit: function () {
            var formValid = this.validate();

            if (formValid.isValid) {
                _sendRequest($scope.url);
            } else {
                $scope.status = 'error';

                formValid.errorFields.splice(0, 0, 'Запрос не отправлен');
                $scope.statusClarify.length = 0;
                $scope.statusClarify = formValid.errorFields.concat();
            }

        }
    };


    function _sendRequest(url) {

        $scope.isWaitingResp = true;
        $scope.statusClarify.length = 0;
        $http({
            method: 'GET',
            url: url
        }).then(function successCallback(response) {
            var data = response.data;
            $scope.status = data.status;
            $scope.statusClarify.push(data.status);
            switch (data.status) {
                case 'success':
                    break;
                case 'error':
                    $scope.statusClarify.push(data.reason);
                    break;
                case 'progress':
                    $scope.statusClarify.push("Повторный запрос произойдёт через  " + data.timeout + " мс");
                    $timeout(function () {
                        _sendRequest($scope.url); //глобальный $scope.url чтобы можно было остановить повторные запросы
                                                  // и увидеть вот это "логика должна повторяться, пока в ответе не вернется отличный от progress статус"
                    }, data.timeout);
                    break;
            }
        }, function errorCallback() {
            $scope.status = 'error';
            $scope.statusClarify.push('error');
            $scope.statusClarify.push('Страница не найдена');
        }).then(function () {
            if ($scope.status !== 'progress') {
                $scope.isWaitingResp = false;
            }
        });
    }

    $scope.setData = function () {
        $scope.statusClarify.length = 0;
        $scope.status = '';
        $scope.MyForm.setData({
            fio: 'Alexey Sergeevich Sh',
            email: 'Shadrov.al@ya.ru',
            phone: '+7(904)001-00-00',
            hobby: 'bicycle'
        });
    };

    $scope.getFormData = function () {
        alert(JSON.stringify($scope.MyForm.getData()));
    };

    function _onlyFreeWord(fio) {
        var fioAr = fio.split(' '),
            wordCount = 0,
            onlyLetters = RegExp('[A-Za-zА-Яа-я]');
        for (var i=0; i<fioAr.length; i++) {
            if (fioAr[i]) {
                console.log(fioAr[i]);
                console.log(onlyLetters.test(fioAr[i]));
                if (onlyLetters.test(fioAr[i])) {
                    wordCount += 1
                } else {
                    return false;
                }
            }
        }
        return wordCount <= 3;
    }

    function _isGoodSumPhoneNumber(phone, max) {
        var sum = 0;
        for (var i = 0; i < phone.length; i++) {
            var num = +phone.charAt(i);
            if (!isNaN(num)) {
                sum += num;
            }
        }
        return sum <= max;
    }
});