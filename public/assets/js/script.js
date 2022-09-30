$(function(){
    
    var x; //x座標
    var y;//y座標
    //ユーザーの現在の位置情報を取得
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
    
    /***** ユーザーの現在の位置情報を取得 *****/
    function successCallback(position) {
        x = position.coords.longitude;
        y = position.coords.latitude;
        
        var latlng = new google.maps.LatLng(y, x); 
        var myOptions = { 
          zoom: 15, 
          center: latlng, 
          mapTypeId: google.maps.MapTypeId.ROADMAP 
        }; 
        var map = new google.maps.Map(document.getElementById("map"), myOptions); 
        
        var currentusericon = $('#map2').data("id");
        var myLatlng = new google.maps.LatLng(y, x);
        var marker = new google.maps.Marker({
           position: myLatlng,
           icon: {
                url: currentusericon[0]['icon'],
                scaledSize: new google.maps.Size(40, 40),
           },
           map: map,
        });
        
        var locations = $('#map').data("id");
        var markerData = [];
        for (var i = 0; i < locations.length; i++) {
            markerData.unshift(locations[i]["location"]);
            console.log(markerData);
        }
        console.log(markerData);
        for (var i = 0; i < markerData.length; i++) {
                const image = markerData[i]['icon']
                markerLatLng = new google.maps.LatLng({lat: markerData[i]['y'], lng: markerData[i]['x']}); // 緯度経度のデータ作成
                marker[i] = new google.maps.Marker({ // マーカーの追加
                    position: markerLatLng, // マーカーを立てる位置を指定
                    map: map, // マーカーを立てる地図を指定
                    icon: {
                        url: image,
                        scaledSize: new google.maps.Size(40, 40),
                    }
               });
         }
         
         //リクエスト時のクエリパラメータ
        const query_params = new URLSearchParams({ 
            appid: "09646546925253fd274d417c075b6de5", 
            lon: x,
            lat: y,
            lang:"ja",
        });
        
        //APIリクエスト
        fetch("https://api.openweathermap.org/data/2.5/weather?" + query_params)
        .then(response => {
            return response.json();
        })
        .then(data => {
            var iconcode = data.weather[0].icon;
            var iconurl = "http://openweathermap.org/img/w/" + iconcode + ".png";
            $('#wicon').attr('src', iconurl);
        });
      
    }
    
    
    /***** 位置情報が取得できない場合 *****/
    function errorCallback(error) {
      var err_msg = "";
      switch(error.code)
      {
        case 1:
          err_msg = "位置情報の利用が許可されていません";
          break;
        case 2:
          err_msg = "デバイスの位置が判定できません";
          break;
        case 3:
          err_msg = "タイムアウトしました";
          break;
      }
      console.log(err_msg);
    }
    
    let week = ["日", "月", "火", "水", "木", "金", "土"];
    let today = new Date();
    // 月末だとずれる可能性があるため、1日固定で取得
    var showDate = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // 初期表示
    window.onload = function () {
        showProcess(today, calendar);
    };
    
    // 前の月表示
    function prev(){
        showDate.setMonth(showDate.getMonth() - 1);
        showProcess(showDate);
    }
    
    // 次の月表示
    function next(){
        showDate.setMonth(showDate.getMonth() + 1);
        showProcess(showDate);
    }
    
    // カレンダー表示
    function showProcess(date) {
        var year = date.getFullYear();
        var month = date.getMonth();
        document.getElementById('header').innerHTML = year + "年 " + (month + 1) + "月";
    
        var calendar = createProcess(year, month);
        document.getElementById('calendar').innerHTML = calendar;
    }
    
    // showProcess(today);
    
    // カレンダー作成
    function createProcess(year, month) {
        // 曜日
        var calendar = "<table><tr class='dayOfWeek'>";
        for (var i = 0; i < week.length; i++) {
            calendar += "<th>" + week[i] + "</th>";
        }
        calendar += "</tr>";
    
        var count = 0;
        var startDayOfWeek = new Date(year, month, 1).getDay();
        var endDate = new Date(year, month + 1, 0).getDate();
        var lastMonthEndDate = new Date(year, month, 0).getDate();
        var row = Math.ceil((startDayOfWeek + endDate) / week.length);
    
        // 1行ずつ設定
        for (var i = 0; i < row; i++) {
            calendar += "<tr>";
            // 1colum単位で設定
            for (var j = 0; j < week.length; j++) {
                if (i == 0 && j < startDayOfWeek) {
                    // 1行目で1日まで先月の日付を設定
                    calendar += "<td class='disabled'>" + (lastMonthEndDate - startDayOfWeek + j + 1) + "</td>";
                } else if (count >= endDate) {
                    // 最終行で最終日以降、翌月の日付を設定
                    count++;
                    calendar += "<td class='disabled'>" + (count - endDate) + "</td>";
                } else {
                    // 当月の日付を曜日に照らし合わせて設定
                    count++;
                    if(year == today.getFullYear()
                      && month == (today.getMonth())
                      && count == today.getDate()){
                        calendar += "<td class='today'>" + count + "<form action='/createplan'>" + "<input type='text' name='body'>" + "<input type='hidden' name='date' value=" + count + ">" + "<input type='submit'>" + "</td>";
                    } else {
                        calendar += "<td>" + count + "<form action='/createplan'>" + "<input type='text' name='body'>" + "<input type='hidden' name='date' value=" + count + ">" + "<input type='submit'>" + "</form>" + "</td>";
                    }
                }
            }
            calendar += "</tr>";
        }
        return calendar;
    }
    
    
    //投稿
    var post = function(){
        
        var content = $(".content").val();
        var category = $(".category").val();
        
        $.ajax({
            url: "/post",
            type: "POST",
            data: {
                x: x,
                y: y,
                content: content,
                category: category
            },
            dataType: "json"
        }).then(function(data){
            var contribution = $(`<div class="contribution">
                    <div class="user-image">
                        <a href="/userhome/${data.id}"><img class="usericon" src="${data.postimg}"></a>
                    </div>
                    <div class="post-list">
                        <div class="station">
                            <span class="name">${data.station}</span>
                        </div>
                        <p>${data.content}</p>
                        <p>${data.category}</p>
                        <p>${data.time}</p>
                    </div>
                </div>
                <div class="border"></div>`
            );
            console.log(contribution)
            $(".contributions").prepend(contribution);
        });
        
        return false;
        
    };
    
    $(".postbtn").click(post)
    
    
    //メッセージ
    //  var message = function(){
        
    //     var messagebody = $(".messagebody").val();
        
    //     $.ajax({
    //         url: "/sendmessage",
    //         type: "POST",
    //         data: {
    //             body: body
    //         },
    //         dataType: "json"
    //     }).then(function(data){
    //         var contribution = $(`<div class="contribution">
    //                 <div class="user-image">
    //                     <a href="/userhome/${data.id}"><img src="${data.postimg}"></a>
    //                 </div>
    //                 <div class="post-list">
    //                     <div class="station">
    //                         <span class="name">${data.station}</span>
    //                     </div>
    //                     <p>${data.content}</p>
    //                     <p>${data.category}</p>
    //                     <p>${data.time}</p>
    //                 </div>
    //             </div>`
    //         );
            
    //         $(".contributions").prepend(contribution);
    //     });
        
    //     return false;
        
    // };
    
    // $(".sendmessage").click(post)
    
    
    //検索
    var searchuser = function(){
        
        var keyword = $(".keyword").val();
        
        $.ajax({
            url: "/search",
            type: "POST",
            data: {
                keyword: keyword
            },
            dataType: "json"
        }).then(function(data){
            console.log(data)
            var search = $(`<p>検索結果<p>
                <div class="search-user">
                    <a href="/userhome/${data.id}" ><img class="usericon" src="${data.img}"></a>
                    <a href="/userhome/${data.id}">${data.name}</a>
                </div>`
            );
            console.log(search)
            
            $(".search-box").prepend(search);
        });
        
        return false;
        
    };
    
    $(".searchbtn").click(searchuser)
    
    
    
    //フォロー
    var clickFollowBtn = function(){
        var id = $(this).data("id");
        
        $.ajax({
          url: "/follow",
          type: "POST",
          data: {
            id: id
          },
          dataType: "json"
        }).then(function(data){
          if (data["following"]) {
            $(".followbtn").text("フォロー解除");
          } else {
            $(".followbtn").text("フォローする");
          }
        });
        
        return false;
        
    };
    
    $(".followbtn").click(clickFollowBtn);
    
});

$('.input-text').focus(function(){
    $('.password_box').animate({borderTopColor: '#3be5ae', borderLeftColor: '#3be5ae', borderRightColor: '#3be5ae', borderBottomColor: '#3be5ae'}, 200);
}).blur(function(){
    $('.password_box').animate({borderTopColor: '#d3d3d3', borderLeftColor: '#d3d3d3', borderRightColor: '#d3d3d3', borderBottomColor: '#d3d3d3'}, 200);
});

//画面が読み込まれたら＆リサイズされたら
$(window).on('load resize', function() {
    var windowWidth = window.innerWidth;
    var elements = $('nav');//position: sticky;を指定している要素
    if (windowWidth >= 768) {/*768px以上にIE用のJSをきかせる*/
        Stickyfill.add(elements);
    }else{
        Stickyfill.remove(elements);
    } 
});

$(window).on('load resize', function() {
    var windowWidth = window.innerWidth;
    var elements = $('.sub-content');//position: sticky;を指定している要素
    if (windowWidth >= 768) {/*768px以上にIE用のJSをきかせる*/
        Stickyfill.add(elements);
    }else{
        Stickyfill.remove(elements);
    } 
});

$(document).ready(function(){
    var day = new Date();
    var hour = day.getHours();
    
    if( hour <= 4 )	{	
        $('#container').css('background-color','#202f55');
        $('nav').css('background-color', '#202f55');
        $('.border').css('border-top', '1px solid #eddc44');
        $('nav').css('border-right', '1px solid #eddc44');
        $('.sub-content').css('border-left', '1px solid #eddc44');
        $('.borderuserhome').css('border-top', '1px solid #eddc44');
        $('body').css('color', '#ddd');
        $('.nav-text').css('color', '#ddd');
        $('a').css('color', '#ddd');
        $('.login').css('color', 'black');
    }
    else if( hour <= 9 )	{	
        $('#container').css('background-color','#ffedab');
        $('nav').css('background-color', '#ffedab');
        $('.border').css('border-top', '1px solid #ffd1a3');
        $('nav').css('border-right', '1px solid #ffd1a3');
        $('.sub-content').css('border-left', '1px solid #ffd1a3');
        $('.borderuserhome').css('border-top', '1px solid #ffd1a3');
        $('a').css('color', 'black');
    }
    else if( hour <= 15 ) {
        $('#container').css('background-color','#e5ffff');
        $('nav').css('background-color', '#e5ffff');
        $('.border').css('border-top', '1px solid #ffddbc');
        $('nav').css('border-right', '1px solid #ffddbc');
        $('.sub-content').css('border-left', '1px solid #ffddbc');
        $('.borderuserhome').css('border-top', '1px solid #ffddbc');
        $('a').css('color', 'black');
    }
    else if( hour <= 20 ) {	
        $('#container').css('background-color','#bd6856');
        $('nav').css('background-color', '#bd6856');
        $('.border').css('border-top', '1px solid #192f60');
        $('nav').css('border-right', '1px solid #192f60');
        $('.sub-content').css('border-left', '1px solid #192f60');
        $('.borderuserhome').css('border-top', '1px solid #192f60');
        $('a').css('color', 'black');
    }
    else {
        $('#container').css('background-color','#202f55');
        $('nav').css('background-color', '#202f55');
        $('.border').css('border-top', '1px solid #eddc44');
        $('nav').css('border-right', '1px solid #eddc44');
        $('.sub-content').css('border-left', '1px solid #eddc44');
        $('.borderuserhome').css('border-top', '1px solid #eddc44');
        $('body').css('color', '#ddd');
        $('.nav-text').css('color', '#ddd');
        $('a').css('color', '#ddd');
        $('.login').css('color', 'black');
    }
});


