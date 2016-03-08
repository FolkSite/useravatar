/*
 * v 1.0.3
 */

var UserAvatarModal = {

    get: function(name) {
        var template = [];
        var all = {
            base: [
                '<div class="user-avatar-img-container">',
                '<img class="user-avatar-upload-img" src="" alt="">',
                '</div>',
                '<div style="margin:20px 0 0 0; text-align: center;">',
                '<div class="user-avatar-upload-btn btn btn-info">upload</div>',
                '</div>'
            ]
        };

        if (all[name]) {
            template = all[name];
        }

        return template.join('');
    }

};


var UserAvatar = {
    config: {

    },

    initialize: function (opts) {
        var config = $.extend(true, {}, this.config, opts);

        if (!jQuery.cropper) {
            document.writeln('<style data-compiled-css>@import url(' + config.assetsBaseUrl + 'components/useravatar/vendor/cropper/dist/cropper.min.css); </style>');
            document.writeln('<script src="' + config.assetsBaseUrl + 'components/useravatar/vendor/cropper/dist/cropper.min.js"><\/script>');
        }

        if (!jQuery().colorbox) {
            document.writeln('<style data-compiled-css>@import url(' + config.assetsBaseUrl + 'components/useravatar/vendor/colorbox/example1/colorbox.css); </style>');
            document.writeln('<script src="' + config.assetsBaseUrl + 'components/useravatar/vendor/colorbox/jquery.colorbox-min.js"><\/script>');
        }

        if (!jQuery().toBlob) {
            document.writeln('<script src="' + config.assetsBaseUrl + 'components/useravatar/vendor/canvastoblob/js/canvas-to-blob.min.js"><\/script>');
        }

        $(document).on('click', '.user-avatar-upload-btn', function() {

            var $image = $('.user-avatar-upload-img');
            var data = $image.cropper('getData');

            if (!data) {
                return;
            }

            $image.cropper('getCroppedCanvas', data).toBlob(function (file) {

                var formData = new FormData();

                formData.append('file', file, 'avatar.jpg');
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
                    success: function(response) {
                        $.colorbox.close();
                    }
                });
            },'image/jpeg');

            return false;
        });

        $(document).ready(function () {

            $('#' + config.propkey).each(function () {
                if (!this.id) {
                    console.log('[UserAvatar:Error] Initialization Error. Id required');
                    return;
                }
                var $this = $(this);
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

                    if (!$.colorbox) {
                        return;
                    }

                    if (files && files.length) {
                        file = files[0];

                        if (/^image\/\w+$/.test(file.type)) {

                            $.colorbox({
                                html: UserAvatarModal.get('base'),
                                closeButton: false,
                                transition:'none',
                                scrolling: false,

                                onComplete:function(){

                                    var $image = $('.user-avatar-upload-img');

                                    $image.cropper('destroy');
                                    $image.on({
                                        'build.cropper': function (e) {
                                            $('.user-avatar-img-container').css({
                                                'width':  $(window).width() / 3,
                                                'height': $(window).height() / 2
                                            });
                                        },
                                        'built.cropper': function (e) {
                                            parent.$.fn.colorbox.resize({
                                                innerWidth: $(window).width() /3
                                            });
                                        }
                                    }).cropper({
                                        aspectRatio: 1,
                                        preview: '.user-avatar-preview',
                                        crop: function (e) {

                                        },
                                        minCropBoxWidth:200,
                                        minCropBoxHeight:200,
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

                                onCleanup:function(){

                                },
                                onClosed:function(){

                                }
                            });

                        } else {
                            window.alert('Please choose an image file.');
                        }
                    }
                });


            });

        });

    },

};

