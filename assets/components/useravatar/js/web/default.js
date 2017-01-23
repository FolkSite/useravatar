/*
 * v 1.1.2
 */

var UserAvatarModal = {

    get: function(name, config) {
        var template = [];
        var all = {
            base: [
                '<div class="user-avatar-wrapper">',
                '<div class="user-avatar-img-container">',
                '<div class="user-avatar-progress"><span class="user-avatar-upload" data-user-avatar-upload></span></div>',
                '<img class="user-avatar-upload-img" src="" alt="">',
                '</div>',
                '<div style="margin:15px 0 0 0; text-align: center;">',
                '<button class="user-avatar-upload-btn btn btn-info">{upload_file}</button>',
                '</div>',
                '</div>'
            ],
            base2: [
                '<div class="user-avatar-wrapper">',
                '<div class="user-avatar-img-container">',
                '<div class="user-avatar-progress"><span class="user-avatar-upload" data-user-avatar-upload></span></div>',
                '<img class="user-avatar-upload-img" src="" alt="">',
                '</div>',
                '<div style="margin:15px 0 0 0; text-align: center;">',
                '<button class="user-avatar-upload-btn btn btn-info">{upload_file}</button>',
                '</div>',
                '</div>'
            ]
        };

        if (all[name]) {
            template = all[name];
        }
        template = template.join('');

        var UserAvatarLexicon = config.lexicon || {};
        for (var key in UserAvatarLexicon) {
            template = template.replace(new RegExp('{' + key + '}', "g"), UserAvatarLexicon[key]);
        }

        return template;
    }

};


var UserAvatar = {
    config: {

    },

    initialize: function (opts) {
        var config = $.extend(true, {}, this.config, opts);

        var canvas = HTMLCanvasElement && HTMLCanvasElement.prototype;

        if (!jQuery().cropper) {
            document.writeln('<style data-compiled-css>@import url(' + config.assetsBaseUrl + 'components/useravatar/vendor/cropper/dist/cropper.min.css); </style>');
            document.writeln('<script src="' + config.assetsBaseUrl + 'components/useravatar/vendor/cropper/dist/cropper.min.js"><\/script>');
        }

        if (!canvas.toBlob) {
            document.writeln('<script src="' + config.assetsBaseUrl + 'components/useravatar/vendor/canvastoblob/js/canvas-to-blob.min.js"><\/script>');
        }

        if (!jQuery().modal) {
            document.writeln('<style data-compiled-css>@import url(' + config.assetsBaseUrl + 'components/useravatar/vendor/bs3modal/dist/css/bootstrap-modal.css); </style>');
            document.writeln('<script src="' + config.assetsBaseUrl + 'components/useravatar/vendor/bs3modal/dist/js/bootstrap-modal.js"><\/script>');
        }

        if (!jQuery().dialog) {
            document.writeln('<style data-compiled-css>@import url(' + config.assetsBaseUrl + 'components/useravatar/vendor/bs3dialog/dist/css/bootstrap-dialog.min.css); </style>');
            document.writeln('<script src="' + config.assetsBaseUrl + 'components/useravatar/vendor/bs3dialog/dist/js/bootstrap-dialog.min.js"><\/script>');
        }

        $(document).ready(function () {

            $('#' + config.propkey).each(function () {
                if (!this.id) {
                    console.log('[UserAvatar:Error] Initialization Error. Id required');
                    return;
                }
                var $this = $(this);
                var UserAvatarConfig = $.extend({}, config, $this.data());

                var $inputAvatar = $this.find('input[name="file"]');

                var URL = window.URL || window.webkitURL;
                var blobURL;

                if (!URL) {
                    $inputAvatar.prop('disabled', true).parent().addClass('disabled');
                    return;
                }

                $inputAvatar.change(function () {
                    var files = this.files;
                    var file;

                    if (files && files.length) {
                        file = files[0];

                        if (/^image\/\w+$/.test(file.type)) {

                            BootstrapDialog.show({
                                title: null,
                                message: UserAvatarModal.get(UserAvatarConfig.template || 'base', UserAvatarConfig),
                                onshown: function(dialogRef){
                                    var $image = $('.user-avatar-upload-img');

                                    $image.cropper('destroy');
                                    $image.on({
                                        'build.cropper': function (e) {
                                            $('.user-avatar-img-container').css({
                                                'height': $(window).height() / 2
                                            });
                                        },
                                        'built.cropper': function (e) {

                                        }
                                    }).cropper({
                                        aspectRatio: 1,
                                        preview: '.user-avatar-preview'
                                    });

                                    if (!$image.data('cropper')) {
                                        return;
                                    }

                                    blobURL = URL.createObjectURL(file);
                                    $image.one('built.cropper', function () {
                                        URL.revokeObjectURL(blobURL);
                                    }).cropper('reset').cropper('replace', blobURL);
                                    $inputAvatar.val('');

                                },
                            }).getModalHeader().hide();

                        } else {
                            window.alert('Please choose an image file.');
                        }
                    }
                });


            });

        });


        $(document).on('click', '.user-avatar-upload-btn', function() {

            var $this = $(this);
            var $wrapper = $this.closest('.user-avatar-wrapper');
            var $image = $wrapper.find('.user-avatar-upload-img');
            var $upload = $wrapper.find('.user-avatar-upload');
            var data = $image.cropper('getData');

            if (!data) {
                return;
            }

            $this.attr('disabled', true);

            $image.cropper('getCroppedCanvas', data).toBlob(function (file) {

                var formData = new FormData();

                formData.append('file', file, 'avatar.png');
                formData.append('action', 'avatar/upload');
                formData.append('data', JSON.stringify(data));
                formData.append('propkey', config.propkey);
                formData.append('ctx', config.ctx);

                $.ajax({
                    url: config.actionUrl,
                    dataType: 'json',
                    delay: 200,
                    type: 'POST',
                    cache: false,
                    data: formData,
                    processData: false,
                    contentType: false,
                    xhr: function(){
                        var xhr = $.ajaxSettings.xhr();
                        xhr.upload.addEventListener('progress', function(evt){
                            if(evt.lengthComputable) {
                                var progress = Math.ceil(evt.loaded / evt.total * 100);
                                if ($upload) {
                                    $upload
                                        .attr('data-user-avatar-upload', progress)
                                        .data('user-avatar-upload', progress)
                                        .html(progress + "%");
                                }
                            }
                        }, false);
                        return xhr;
                    },
                    success: function(response) {
                        $('.modal.in').modal('hide');
                    }
                });
            }, 'image/png');

            return false;
        });


    },

};

