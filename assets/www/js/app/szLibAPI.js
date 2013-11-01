;(function(){
    var _baseUrl  = "http://apigather.duapp.com/szlib/";
//    var _baseUrl  = "http://localhost:8080/api/szlib/";
    var _get = function(url,param,success,error){
        _ajax('get',url,param,success,error);
    }
    var _post = function(url,param,success,error){
        _ajax('post',url,param,success,error);
    }
    var _ajax = function(type,url,param,success,error){
        url = _baseUrl+url;
        //判断当前是手机端(phonegap)还是浏览器端，手机端通过phonegap的白名单进行跨域，浏览器端采用nodejs进行跨域转发
        if(location.protocol == 'http:'){
            if(type == 'get'){
                url = '/proxy?url='+url+'?'+ $.param(param);
                param = {};
            }else{
                url = '/proxy?url='+url;
            }
        }
        var options = {
            url : url,
            type : type||'get',
            data : param,
            timeout : 120000,//超时时间默认2分钟
            success : success,
            cache : type == 'get'?false:true,
            error : function(xhr,type){
                if(error){
                    error(xhr,type);
                }else{
                    _parseError(xhr,type,url);
                }
            },
            dataType : 'json'
        }
        $.ajax(options);
    }

    function _parseError(xhr,type,url){
        if(J.hasPopupOpen){
            J.hideMask();
        }
        if(type == 'timeout'){
            J.showToast('连接服务器超时,请检查网络是否畅通！','error');
        }else if(type == 'parsererror'){
            J.showToast('解析返回结果失败！','error');
        }else if(type == 'error'){
            var data;
            try{
                data = JSON.parse(xhr.responseText);
                if(data.code && data.message){
                    J.showToast(data.message,'error');
                }else{
                    J.showToast('连接服务器失败！','error');
                }
            }catch(e){
                J.showToast('连接服务器失败！','error');
            }
        }else{
            J.showToast('未知异常','error');
        }
    }

    window.SzLibAPI = {
        'login' : function(username,pwd,success,error){
            _get('login',{username:username,password:pwd},success,error);
        },
        'getLoanBooks' : function(readerNo,success,error){
            _get('query/loanbooks',{readerNo:readerNo},success,error);
        },
        'renewBook' : function(barCode,name,pwd,success,error){
            _get('renewbooks',{barcode:barCode,userName:name,password:pwd},success,error);
        },
        'getReservebooks' : function(readerNo,success,error){
            _get('query/reservebooks',{readerNo:readerNo},success,error);
        },
        'getReservebookHistory' : function(readerNo,title,page,success,error){
            _get('query/renewbook/history',{readerNo:readerNo,title:title,page:page},success,error);
        },
        'reservebook' : function(callback){//TODO
            _get('reservebook',{},callback);
        },
        'getNotices' : function(page,success,error){
            _get('query/notice',{page:page},success,error);
        },
        'getForum' : function(page,success,error){
            _get('query/forum',{page:page},success,error);
        },
        'getNewsDetail' : function(id,success,error){
            _get('query/news/'+id,{},success,error);
        },
        'getLoanBooks' : function(readerNo,success,error){
            _get('query/loanbooks',{readerNo:readerNo},success,error);
        },
        'getSelflib' : function(callback){
            _get('query/selflib',{},callback);
        },
        'queryBook' : function(searchType,bookType,key,page,success,error){
            _get('query/book',{searchType:searchType,bookType:bookType,key:key,page:page},success,error);
        },
        'getBook' : function(recordNo,success,error){
            _get('query/book/'+recordNo,{},success,error);
        },
        'getNewBookList' : function(date,success,error){
            _get('query/newbook/'+date,{},success,error);
        },
        'getLibBookList' : function(libno,success,error){
            _get('query/lib/'+libno,{},success,error);
        },
        'getBookReview' : function(doubanId,page,success,error){
            _get('book/'+doubanId+'/review/'+page,{},success,error);
        },
        'changeLoginName' : function(username,pwd,loginName,success,error){
            _post('user/changeloginname',{userName:username,password:pwd,loginName:loginName},success,error);
        },
        'changePassword' :  function(username,pwd,newPwd,success,error){
            _post('user/changepwd',{userName:username,password:pwd,newPwd:newPwd},success,error);
        }
    }
})();
