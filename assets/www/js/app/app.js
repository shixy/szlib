document.addEventListener('deviceready', onDeviceReady, false);
function onDeviceReady(){
    //注册后退按钮
    document.addEventListener("backbutton", function (e) {
        if(J.isMenuOpen){
            J.Menu.hide();
        }else if(J.hasPopupOpen){
            J.closePopup();
        }else{
			
            var sectionId = $('section.active').attr('id');
            if(sectionId == 'index_section'){
                J.confirm('提示','是否退出程序？',function(){
                    navigator.app.exitApp();
                });
            }else{
                J.Router.back();
            }
        }
    }, false);
    App.run();
    navigator.splashscreen.hide();
}
var App = (function(){
    var pages = {};
    var run = function(){
        $.each(pages,function(k,v){
            var sectionId = '#'+k+'_section';
            $('body').delegate(sectionId,'pageinit',function(){
                v.init && v.init.call(v);
            });
            $('body').delegate(sectionId,'pageshow',function(e,isBack){
                //页面加载的时候都会执行
                v.show && v.show.call(v);
                //后退时不执行
                if(!isBack && v.load){
                    v.load.call(v);
                }
            });
        });
        Jingle.launch({
            showWelcome:false
        });
        _initUserInfo();
    };
    var page = function(id,factory){
        return ((id && factory)?_addPage:_getPage).call(this,id,factory);
    }
    var _addPage = function(id,factory){
        pages[id] = new factory();
    };
    var _getPage = function(id){
        return pages[id];
    }

    var checkNetwork = function(){
        if(!navigator.connection)return true;
        var networkState = navigator.connection.type;
        if(networkState == Connection.CELL_2G){
            var network2g = localStorage.getItem("network-2g");
            if(network2g == 0){
                return true;
            }else{
                return confirm('您当前使用的是2G网络，是否继续？');
            }
        }else if(networkState == Connection.NONE){
            if(confirm('当前没有网络连接,是否使用离线方式访问？')){
                J.offline = true;
                $('#btn_offline').val(1);
                return true;
            }
            return false;
        }
        return true;
    }

    var showLogin = function(callback){
        J.popup({
            pos : {
                top:0,left:0,bottom:0,right:0
            },
            tplId : 'login_tpl',
            onShow : function(){
                $('#btn_login').tap(function(){
                    _login(callback);
                });
            }
        });
    }

    var _login = function(callback){
        var username = $('#username').val();
        var pwd = $('#password').val();
        if(username == '' || pwd == ''){
            J.showToast('请填写完整的信息！');
        }else{
            $('#btn_login .icon').removeClass('lock').addClass('spinner');
            SzLibAPI.login(username,pwd,function(result){
                $('#btn_login .icon').removeClass('spinner').addClass('lock');
                if(result.error){
                    J.showToast(result.error,'error');
                }else{
                    App.userInfo = result;
                    App.userInfo.p = pwd;
                    window.localStorage.setItem('userInfo',JSON.stringify(result));
                    callback.call();
                }
            },function(){
                J.showToast('请检查您的网络连接','error');
            });

        }
        return false;
    }

    var _initUserInfo = function(){
        var userInfo = window.localStorage.getItem('userInfo');
        userInfo && (App.userInfo = JSON.parse(userInfo));
    }

    return {
        run : run,
        page : page,
        checkNetwork : checkNetwork,
        showLogin : showLogin
    }
}());
if(J.isWebApp){
    $(function () {
        App.run();
    })
}

App.page('index',function(){
    this.init = function(){
        _initIndex();
        _initUserService();
        _initTelService();
        _initSearchService();
        $('#btn_scan_barcode').on('tap',function(){
            window.plugins.barcodeScanner.scan('one',function(result) {
                    if(!result.cancelled){
                        App.page('search').searchParam = {
                            value : result.text,
                            searchType : 'isbn',
                            bookType : ''
                        }
                        J.Router.turnTo('#search_section');
                    }
                }, function(error) {
                    J.showToast("扫描失败: " + error,'error');
                }
            );
        })
    };
    _initIndex = function(){
        new J.Slider({
            selector : '#index_images',
            noDots : true,
            autoPlay : true
        });
    }
    _initUserService = function(){
        $('#anchor_user_service').tap(function(){
            var $this = $(this);
            if(App.userInfo){
                J.Router.showArticle('#index_user_article',$this);
            }else{
                var $this = $(this);
                App.showLogin(function(){
                    J.closePopup();
                    J.Router.showArticle('#index_user_article',$this);
                });
            }
        });
        $('#btn_exit_user').on('tap',function(){
            window.localStorage.removeItem("userInfo");
            App.userInfo = null;
            $('#index_section footer a:eq(0)').trigger('tap');
        });
        $('#index_user_article').on('articleshow',function(){
            $('#txt_username').text(App.userInfo.userName);
            $('#txt_loginname').text(App.userInfo.loginName);
            $('#txt_cardno').text(App.userInfo.cardNo);
        });
        $('#link_change_loginname').on('tap',function(){
            J.popup({
                tplId:'tpl_change_loginname',
                pos : 'top',
                height : 190,
                showCloseBtn : false,
                onShow : function(){
                    var $this = $(this);
                    //J.Element.init(this);
                    $this.find('button').on('tap',function(){
                        var $loading = $(this).next();
                        var newName = $this.find('input').val();
                        if(_checkUserName(newName)){
                            $loading.show();
                            SzLibAPI.changeLoginName(App.userInfo.loginName,App.userInfo.p,newName,function(data){
                                $loading.hide();
                                if(data.success){
                                    J.showToast(data.success,'success');
                                    App.userInfo.loginName = newName;
                                    $('#txt_loginname').text(newName);
                                    window.localStorage.setItem('userInfo',JSON.stringify(App.userInfo));
                                    J.closePopup();
                                }else{
                                    J.showToast(data.failure,'error');
                                }
                            })
                        }
                    })
                }
            })
        });
        $('#link_change_pwd').on('tap',function(){
            J.popup({
                tplId:'tpl_change_password',
                pos : 'top',
                height : 190,
                showCloseBtn : false,
                onShow : function(){
                    var $this = $(this);
                    $this.find('button').on('tap',function(){
                        var $loading = $(this).next();
                        var newPwd = $this.find('input').val();
                        if(_checkPassword(newPwd)){
                            $loading.show();
                            SzLibAPI.changePassword(App.userInfo.loginName,App.userInfo.p,newPwd,function(data){
                                $loading.hide();
                                if(data.success){
                                    J.showToast(data.success,'success');
                                    App.userInfo.p = newPwd;
                                    window.localStorage.setItem('userInfo',JSON.stringify(App.userInfo));
                                    J.closePopup();
                                }else{
                                    J.showToast(data.failure,'error');
                                }
                            })
                        }
                    })
                }
            })
        });

        var _checkUserName = function(userName){
            if(userName.length<4){
                J.showToast("登录名长度太短，请重新输入！");
                return false;
            }
            if($.trim(userName)==""){
                J.showToast("登录名输入不能为空！");
                return false;
            }
            if(userName==App.userInfo.loginName){
                J.showToast("新旧登录名一致，请确认！");
                return false;

            }
            if(/.*[\u4e00-\u9fa5]+.*$/.test(userName)){
                J.showToast("不能含有汉字！");
                return false;
            }
            return true;
        }
        var _checkPassword = function(password){
            if($.trim(password)==""){
                J.showToast("密码不能为空！");
                return false;
            }
            if($.trim(password)== App.userInfo.p){
                J.showToast("与旧密码一样");
                return false;
            }
            return true;
        }

    };
    var _initTelService = function(){
        $.getJSON('data/telservice.json',function(data){
            J.tmpl('#index_phone_article ul','tel_service_tpl',data);
            J.Scroll('#index_phone_article');
        });
    }
    var _initSearchService = function(){
        $('#btn_index_search').on('tap',function(){
            var value =  $('#index_search_value').val();
            if($.trim(value) == ''){
                J.showToast('请输入关键字');
                return;
            }
            App.page('search').searchParam = {
                value : value,
                searchType : 'all',
                bookType : $('#checkbox_reserve').data('checkbox') == 'checked'?'local_reserve':''
            }
            J.Router.turnTo('#search_section');
        });
        $('#index_search_article').on('articleshow',function(){
            var loaded = $(this).data('loaded');
            if(loaded)return;
            $(this).data('loaded',true);
            var date = new Date();
            var year = date.getFullYear();
            var month = date.getMonth()+1;
            if(month<10){
                month = '0'+month;
            }else{
                month = month + '';
            }
            SzLibAPI.getNewBookList(year+month,function(data){
                J.tmpl('#newbook_container','tpl_cloud_tag',data);
            })
        });
        $('#newbook_container').on('tap','div.cloud-tag',function(){
            App.page('book').recordNo = $(this).attr('data-recordno');
            J.Router.turnTo('#book_section');
        })
    }
});
App.page('notice',function(){
    var $list,$getMoreBtn,pageNo;
    this.init = function(){
        $list = $('#notice_article ul');
        $getMoreBtn = $list.next();
        J.showMask();
        pageNo = 1;
        _getPage();
        _subscribeEvents();
    }
    var _getPage = function(){
        SzLibAPI.getNotices(pageNo,function(data){
            if(pageNo == 1){
                _renderFirstPage(data);
            }else{
                _renderNextPage(data);
            }
            J.Scroll('#notice_article');
        });
    }
    var _renderFirstPage = function(data){
        if(data.length > 0){
            J.Scroll('#notice_article').scrollTo(0,0);
            J.tmpl($list,'tpl_notice',data,'replace');
            $getMoreBtn.text('点击加载更多...').show();
        }else{
            $getMoreBtn.hide();
            J.Template.no_result($list);
        }
        J.hideMask();
    }
    var _renderNextPage = function(data){
        if(data.length > 0){
            J.tmpl($list,'tpl_notice',data,'add');
            $getMoreBtn.text('点击加载更多...').show();
        }else{
            pageNo--;
            $getMoreBtn.text('亲，木有了~~').show();
        }
    }
    var _subscribeEvents = function(){
        $list.on('tap','li',function(){
            var id = $(this).attr('data-id');
            App.page('news').id = id;
            J.Router.turnTo('#news_section');
        });
        $getMoreBtn.on('tap',function(){
            $getMoreBtn.text('正在加载...');
            pageNo++;
            _getPage();
        });
        $('#notice_refresh').on('tap',function(){
            J.showMask();
            pageNo = 1;
            _getPage();
        });
    }
});
App.page('lecture',function(){
    var $list,$getMoreBtn,pageNo;
    this.init = function(){
        $list = $('#lecture_article ul');
        $getMoreBtn = $list.next();
        J.showMask();
        pageNo = 1;
        _getPage();
        _subscribeEvents();
    }
    var _getPage = function(){
        SzLibAPI.getForum(pageNo,function(data){
            if(pageNo == 1){
                _renderFirstPage(data);
            }else{
                _renderNextPage(data);
            }
            J.Scroll('#lecture_article');
        });
    }
    var _renderFirstPage = function(data){
        if(data.length > 0){
            J.Scroll('#lecture_article').scrollTo(0,0);
            J.tmpl($list,'tpl_lecture',data,'replace');
            $getMoreBtn.text('点击加载更多...').show();
        }else{
            $getMoreBtn.hide();
            J.Template.no_result($list);
        }
        J.hideMask();
    }
    var _renderNextPage = function(data){
        if(data.length > 0){
            J.tmpl($list,'tpl_lecture',data,'add');
            $getMoreBtn.text('点击加载更多...').show();
        }else{
            pageNo--;
            $getMoreBtn.text('亲，木有了~~').show();
        }
    }
    var _subscribeEvents = function(){
        $list.on('tap','li',function(){
            var id = $(this).attr('data-id');
            App.page('news').id = id;
            J.Router.turnTo('#news_section');
        });
        $getMoreBtn.on('tap',function(){
            $getMoreBtn.text('正在加载...');
            pageNo++;
            _getPage();
        });
        $('#lecture_refresh').on('tap',function(){
            J.showMask();
            pageNo = 1;
            _getPage();
        });
    }
});
App.page('news',function(){
    var $scrollWrapper;
    this.init = function(){
        $scrollWrapper = $('#news_article>div.scrollWrapper');
    }
    this.load = function(){
        $scrollWrapper.width('auto').empty();
        J.showMask();
        SzLibAPI.getNewsDetail(this.id,function(data){
            $('#news_section header .title').text(data.title);
            $scrollWrapper.html(data.result);
            if($scrollWrapper.find('table').length>0){
                $scrollWrapper.width(700);
            }
            J.Scroll('#news_article',{hScroll:true}).scrollTo(0,0);
            J.hideMask();
        });
    }
});
App.page('loanbook',function(){
    var _this = this;
    this.init = function(){
        $('#loanbook_article ul').on('tap','li',function(){
            var $this = $(this);
            if(!$this.data('selected'))return;
            if($this.hasClass('active')){
                $this.removeClass('active');
                $(this).children('.icon').attr('class','icon checkbox-unchecked');
            }else{
                $this.addClass('active');
                $(this).children('.icon').attr('class','icon checkbox-checked');
            }
        });
        $('#btn_renew_book').tap(function(){
            var barcodes = [];
            $('#loanbook_article ul li.active').each(function(){
                barcodes.push($(this).attr('data-barcode'));
            });
            J.showMask();
            SzLibAPI.renewBook(barcodes.join(','),App.userInfo.loginName,App.userInfo.p,function(data){
                if(data.status == 'success'){
                    J.showToast("续借成功","error");
                    _this.load();
                }else{
                    J.hideMask();
                    J.showToast("续借失败："+data.msg,"error");
                }
            });
        });
    }
    this.load = function(){
        J.showMask();
        SzLibAPI.getLoanBooks(App.userInfo.recordNo,function(data){
            if(data.length ==0){
                J.Template.background('#loanbook_article ul','未找到相关记录','notification');
            }else{
                J.tmpl('#loanbook_article ul','tpl_loanbook',data);
                J.Scroll('#loanbook_article');
            }
            J.hideMask();
        });
    }
});
App.page('reservebook',function(){
    this.load = function(){
        J.showMask();
        SzLibAPI.getReservebooks(App.userInfo.recordNo,function(data){
            if(data.length ==0){
                J.Template.background('#reservebook_article ul','未找到相关记录','notification');
            }else{
                J.tmpl('#reservebook_article ul','tpl_reverse',data);
            }
            J.hideMask();
        });
    }
});
App.page('search',function(){
    var _this = this;
    this.searchParam = {};//由其他页面赋值
    var $list,$getMoreBtn,pageNo;
    this.init = function(){
        $list = $('#search_article ul');
        $getMoreBtn = $list.next();
        _subscribeEvents();
    }
    this.load = function(){
        $('#search_section header .title').text(this.searchParam.value);
        J.Scroll('#search_article').scrollTo(0,0);
        pageNo = 1;
        J.showMask();
        _search();
    }

    var _renderFirstPage = function(data){
        if(data.length > 0){
            J.Scroll('#search_article').scrollTo(0,0);
            J.tmpl($list,'tpl_book_search',data,'replace');
            if(data.length>10){
                $getMoreBtn.text('点击加载更多...').show();
            }
        }else{
            $getMoreBtn.hide();
            J.Template.no_result($list);
        }
        J.hideMask();
    }
    var _renderNextPage = function(data){
        if(data.length > 0){
            J.tmpl($list,'tpl_book_search',data,'add');
            $getMoreBtn.text('点击加载更多...').show();
        }else{
            pageNo--;
            $getMoreBtn.text('亲，木有了~~').show();
        }
    }

    var _subscribeEvents = function(){
        $('#search_article ul').on('tap','li',function(){
            App.page('book').recordNo = $(this).attr('data-recordno');
            J.Router.turnTo('#book_section');
        });
        $getMoreBtn.on('tap',function(){
            $getMoreBtn.text('正在加载...');
            pageNo++;
            _search();
        });
        $('#btn_menu_search').on('tap',function(){
            var searchType = $('#menu_search_type').val();
            var value = $('#menu_search_value').val();
            var bookType = $('#menu_checkbox_reserve').data('checkbox') == 'checked'?'local_reserve':'';
            if($.trim(value) == ''){
                J.showToast('请输入关键字');
                return;
            }
            _this.searchParam = {
                value : value,
                searchType : searchType,
                bookType : bookType
            }
            J.Menu.hide();
            _this.load();
        })
    }

    var _search = function(){
        SzLibAPI.queryBook(_this.searchParam.searchType,_this.searchParam.bookType,_this.searchParam.value,pageNo,function(data){
            if(pageNo == 1){
                _renderFirstPage(data);
            }else{
                _renderNextPage(data);
            }
            J.Scroll('#search_article');
        });
    }
});
App.page('selflib',function(){
    this.init = function(){
        J.Scroll('#selflib_section nav.header-secondary',{
            hScroll:true,
            hScrollbar : false
        });
        $('#selflib_section nav.header-secondary a').on('tap',function(){
            var text = $(this).text();
            var target = $('#selflib_article li.divider[data-area^="'+text+'"]')[0];
            J.Scroll('#selflib_article').scrollToElement(target,300);
        })
        $('#selflib_article ul').on('tap','li[data-no]',function(){
            App.page('lib_book').sslNo = $(this).attr('data-no');
            App.page('lib_book').title = $(this).find('strong').text();
            J.Router.turnTo('#lib_book_section');
        });
        $.getJSON('data/selflib.json',function(data){
            J.tmpl('#selflib_article ul','tpl_selflib',data);
            J.Scroll('#selflib_article');
        });
    }
});
App.page('adress',function(){
    this.init = function(){
        J.Scroll('#adress_section nav.header-secondary',{
            hScroll:true,
            hScrollbar : false
        });
        $('#adress_section nav.header-secondary a').on('tap',function(){
            var text = $(this).text();
            var target = $('#adress_article li.divider[data-area^="'+text+'"]')[0];
            J.Scroll('#adress_article').scrollToElement(target,300);
        })
        $.getJSON('data/childlib.json',function(data){
            J.tmpl('#adress_article ul','tpl_adress',data);
            J.Scroll('#adress_article');
        });
    }
});
App.page('lib_book',function(){
    var $list;
    this.init = function(){
        $list = $('#lib_book_article ul');
        $list.on('tap','li',function(){
            App.page('book').recordNo = $(this).attr('data-recordno');
            J.Router.turnTo('#book_section');
        });
    }
    this.load = function(){
        $list.empty();
        $('#lib_book_section header .title').text(this.title);
        J.showMask();
        SzLibAPI.getLibBookList(this.sslNo,function(data){
            J.tmpl($list,'tpl_lib_book',data);
            J.Scroll('#lib_book_article');
            J.hideMask();
        })
    }
});
App.page('book',function(){
    var bookData,$reviewList,$getMoreBtn,pageNo,doubanId;
    this.recordNo = '';
    this.init = function(){
        $reviewList = $('#review_article ul');
        $getMoreBtn = $reviewList.next();
        $('#book_article').on('tap','li span.li-collapsibe',function(){
            var text = $(this).text();
            var $p = $(this).parent();
            if(text == '展开'){
                $p.css('maxHeight','1000px');
                $(this).text('收起');
            }else{
                $p.css('maxHeight','100px');
                $(this).text('展开');
            }
            J.Scroll('#book_article');
        });
        $('#review_article').on('articleshow',function(data){
            var loaded = $(this).data('loaded');
            if(loaded)return;
            $(this).data('loaded',true);
            if(bookData && bookData.doubanId){
                doubanId = bookData.doubanId;
            }
            if(doubanId){
                J.showMask();
                pageNo = 1;
                _getReviewPage();
            }else{
                J.Template.no_result($reviewList);
            }
        });
        _subscribeEvents();
    }
    this.load = function(){
        $('#review_article').data('loaded',false);
        $('#book_article>div').empty();
        $('#catalog_article>div').empty();
        $('#review_article ul').empty();
        J.showMask();
        $('#book_section footer a:eq(0)').trigger('tap');
        SzLibAPI.getBook(this.recordNo,function(data){
            bookData = data;
            $('#book_section header .title').text(data.title);
            J.tmpl('#book_article>div','book_tpl',data);
            J.Scroll('#book_article').scrollTo(0,0);
            J.hideMask();
            _renderDesc();
        });
    }

    var _renderDesc = function(){
        var $authorDesc =$('#author_desc_container'),$bookDesc=$('#book_desc_container'),$catalogArticle=$('#catalog_article>div.scrollWrapper');
        $.ajax({
            url:'http://202.112.150.126/indexc.php',
            data : {
                client:'szlib',
                isbn:bookData.isbn
            },
            dataType:'jsonp',
            error : function(){
                $authorDesc.html('加载失败');
                $bookDesc.html('加载失败');
                $catalogArticle.html('加载失败');
            },
            success:function(data){
                $authorDesc.html(data.result.authorIntroduction);
                $bookDesc.html(data.result.summary);
                $catalogArticle.html(data.result.catalog);
                J.Scroll('#catalog_article').scrollTo(0,0);
                J.Scroll('#book_article');
                if(($authorDesc[0].scrollHeight-$authorDesc.height())>10){
                    $authorDesc.append('<span class="li-collapsibe">展开</span>');
                }
                if(($bookDesc[0].scrollHeight-$bookDesc.height())>10){
                    $bookDesc.append('<span class="li-collapsibe">展开</span>');
                }
            }
        });
    };
    var _getReviewPage = function(){
        SzLibAPI.getBookReview(doubanId,pageNo,function(data){
            if(pageNo == 1){
                _renderFirstPage(data);
            }else{
                _renderNextPage(data);
            }
            J.Scroll('#review_article');
        });
    }
    var _renderFirstPage = function(data){
        if(data.length > 0){
            J.Scroll('#review_article').scrollTo(0,0);
            J.tmpl($reviewList,'tpl_review',data,'replace');
            $getMoreBtn.text('点击加载更多...').show();
        }else{
            $getMoreBtn.hide();
            J.Template.no_result($reviewList);
        }
        J.hideMask();
    }
    var _renderNextPage = function(data){
        if(data.length > 0){
            J.tmpl($reviewList,'tpl_review',data,'add');
            $getMoreBtn.text('点击加载更多...').show();
        }else{
            pageNo--;
            $getMoreBtn.text('亲，木有了~~').show();
        }
    }
    var _subscribeEvents = function(){
        $reviewList.on('tap','li',function(){
            var url = $(this).data("url");
            window.open(url,'_system');
        });
        $getMoreBtn.on('tap',function(){
            $getMoreBtn.text('正在加载...');
            pageNo++;
            _getReviewPage();
        });
    }
});