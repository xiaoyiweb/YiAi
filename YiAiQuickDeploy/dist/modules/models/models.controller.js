'use strict';const _0x455367=_0x445e;function _0x2b80(){const _0x284c5d=['setModel','modelsList','getOwnPropertyDescriptor','6GKXCrU','3921VYnjtT','3309432pBTotn','defineProperty','design:paramtypes','5104620wFGvCH','13175936YOFhdQ','设置模型','queryModelType','prototype','./models.service','Controller','SetModelDto','50692CphBMd','创建修改模型类型','function','SetModelTypeDto','baseConfig','object','./dto/setModel.dto','Query','SuperAuthGuard','12mbPlhD','34937730tuvHwp','../../common/auth/adminAuth.guard','__metadata','setModelType','Post','delModel','__esModule','ApiOperation','932HvZIyo','QueryModelTypeDto','length','__decorate','queryModels','metadata','客户端查询当前所有可以使用的模型','Get','design:returntype','ApiBearerAuth','删除模型','QueryModelDto','../../common/auth/superAuth.guard','getBaseConfig','@nestjs/common','UseGuards','./dto/setModelType.dto','delModelType','decorate','modelsService','管理端查询模型列表','list','1034130PMVPFg','Body','query','ModelsController','./dto/queryModel.dto','./dto/queryModelType.dto','design:type'];_0x2b80=function(){return _0x284c5d;};return _0x2b80();}(function(_0x2d40e5,_0x3ac0f5){const _0x14eb80=_0x445e,_0x284c3f=_0x2d40e5();while(!![]){try{const _0x22fa61=parseInt(_0x14eb80(0x206))/0x1+parseInt(_0x14eb80(0x1d9))/0x2*(-parseInt(_0x14eb80(0x1fa))/0x3)+parseInt(_0x14eb80(0x20f))/0x4*(parseInt(_0x14eb80(0x1ef))/0x5)+-parseInt(_0x14eb80(0x1f9))/0x6*(parseInt(_0x14eb80(0x1fb))/0x7)+-parseInt(_0x14eb80(0x1ff))/0x8+-parseInt(_0x14eb80(0x1fe))/0x9+parseInt(_0x14eb80(0x210))/0xa;if(_0x22fa61===_0x3ac0f5)break;else _0x284c3f['push'](_0x284c3f['shift']());}catch(_0x3bd3fc){_0x284c3f['push'](_0x284c3f['shift']());}}}(_0x2b80,0xd4245));var __decorate=this&&this[_0x455367(0x1dc)]||function(_0x277c90,_0x1ad037,_0x253113,_0xd72a22){const _0x17b0b8=_0x455367;var _0x5ae3f3=arguments['length'],_0x3c28ca=_0x5ae3f3<0x3?_0x1ad037:_0xd72a22===null?_0xd72a22=Object[_0x17b0b8(0x1f8)](_0x1ad037,_0x253113):_0xd72a22,_0x5c496f;if(typeof Reflect===_0x17b0b8(0x20b)&&typeof Reflect[_0x17b0b8(0x1eb)]==='function')_0x3c28ca=Reflect[_0x17b0b8(0x1eb)](_0x277c90,_0x1ad037,_0x253113,_0xd72a22);else{for(var _0x5479b7=_0x277c90[_0x17b0b8(0x1db)]-0x1;_0x5479b7>=0x0;_0x5479b7--)if(_0x5c496f=_0x277c90[_0x5479b7])_0x3c28ca=(_0x5ae3f3<0x3?_0x5c496f(_0x3c28ca):_0x5ae3f3>0x3?_0x5c496f(_0x1ad037,_0x253113,_0x3c28ca):_0x5c496f(_0x1ad037,_0x253113))||_0x3c28ca;}return _0x5ae3f3>0x3&&_0x3c28ca&&Object[_0x17b0b8(0x1fc)](_0x1ad037,_0x253113,_0x3c28ca),_0x3c28ca;},__metadata=this&&this[_0x455367(0x212)]||function(_0x550125,_0x235333){const _0x366a9c=_0x455367;if(typeof Reflect==='object'&&typeof Reflect[_0x366a9c(0x1de)]===_0x366a9c(0x208))return Reflect['metadata'](_0x550125,_0x235333);},__param=this&&this['__param']||function(_0x165a51,_0x46062a){return function(_0x4e2d67,_0x4a2a76){_0x46062a(_0x4e2d67,_0x4a2a76,_0x165a51);};};Object['defineProperty'](exports,_0x455367(0x1d7),{'value':!![]}),exports[_0x455367(0x1f2)]=void 0x0;function _0x445e(_0x336b31,_0x166f84){const _0x2b80bc=_0x2b80();return _0x445e=function(_0x445efc,_0x6cb82f){_0x445efc=_0x445efc-0x1d5;let _0x44f7d2=_0x2b80bc[_0x445efc];return _0x44f7d2;},_0x445e(_0x336b31,_0x166f84);}const swagger_1=require('@nestjs/swagger'),models_service_1=require(_0x455367(0x203)),common_1=require(_0x455367(0x1e7)),superAuth_guard_1=require(_0x455367(0x1e5)),setModel_dto_1=require(_0x455367(0x20c)),queryModel_dto_1=require(_0x455367(0x1f3)),adminAuth_guard_1=require(_0x455367(0x211)),setModelType_dto_1=require(_0x455367(0x1e9)),queryModelType_dto_1=require(_0x455367(0x1f4));let ModelsController=class ModelsController{constructor(_0x4289e3){const _0x3fb7ff=_0x455367;this[_0x3fb7ff(0x1ec)]=_0x4289e3;}['setModel'](_0x5eafa9){const _0x27f7e0=_0x455367;return this['modelsService'][_0x27f7e0(0x1f6)](_0x5eafa9);}[_0x455367(0x1d6)](_0x1b12b8){const _0x3c6559=_0x455367;return this[_0x3c6559(0x1ec)][_0x3c6559(0x1d6)](_0x1b12b8);}[_0x455367(0x1dd)](_0xea5d6,_0x40ceed){const _0x2d71d7=_0x455367;return this['modelsService'][_0x2d71d7(0x1dd)](_0xea5d6,_0x40ceed);}[_0x455367(0x1f7)](){const _0x2cf9ab=_0x455367;return this[_0x2cf9ab(0x1ec)][_0x2cf9ab(0x1f7)]();}[_0x455367(0x20a)](){const _0x386a53=_0x455367;return this[_0x386a53(0x1ec)][_0x386a53(0x1e6)]();}[_0x455367(0x201)](_0x336774){const _0x2ee6ae=_0x455367;return this[_0x2ee6ae(0x1ec)][_0x2ee6ae(0x201)](_0x336774);}[_0x455367(0x213)](_0x46f3f3){const _0x2465b9=_0x455367;return this[_0x2465b9(0x1ec)][_0x2465b9(0x213)](_0x46f3f3);}[_0x455367(0x1ea)](_0x276ad8){const _0x6b62bf=_0x455367;return this[_0x6b62bf(0x1ec)][_0x6b62bf(0x1ea)](_0x276ad8);}};__decorate([(0x0,common_1['Post'])(_0x455367(0x1f6)),(0x0,swagger_1[_0x455367(0x1d8)])({'summary':_0x455367(0x200)}),(0x0,common_1[_0x455367(0x1e8)])(superAuth_guard_1[_0x455367(0x20e)]),(0x0,swagger_1[_0x455367(0x1e2)])(),__param(0x0,(0x0,common_1['Body'])()),__metadata(_0x455367(0x1f5),Function),__metadata(_0x455367(0x1fd),[setModel_dto_1[_0x455367(0x205)]]),__metadata(_0x455367(0x1e1),void 0x0)],ModelsController['prototype'],'setModel',null),__decorate([(0x0,common_1[_0x455367(0x1d5)])(_0x455367(0x1d6)),(0x0,swagger_1[_0x455367(0x1d8)])({'summary':_0x455367(0x1e3)}),(0x0,common_1[_0x455367(0x1e8)])(superAuth_guard_1[_0x455367(0x20e)]),(0x0,swagger_1[_0x455367(0x1e2)])(),__param(0x0,(0x0,common_1[_0x455367(0x1f0)])()),__metadata(_0x455367(0x1f5),Function),__metadata(_0x455367(0x1fd),[Object]),__metadata('design:returntype',void 0x0)],ModelsController[_0x455367(0x202)],'delModel',null),__decorate([(0x0,common_1[_0x455367(0x1e0)])(_0x455367(0x1f1)),(0x0,swagger_1[_0x455367(0x1d8)])({'summary':_0x455367(0x1ed)}),(0x0,common_1[_0x455367(0x1e8)])(adminAuth_guard_1['AdminAuthGuard']),(0x0,swagger_1[_0x455367(0x1e2)])(),__param(0x0,(0x0,common_1['Req'])()),__param(0x1,(0x0,common_1['Query'])()),__metadata(_0x455367(0x1f5),Function),__metadata(_0x455367(0x1fd),[Request,queryModel_dto_1[_0x455367(0x1e4)]]),__metadata(_0x455367(0x1e1),void 0x0)],ModelsController[_0x455367(0x202)],_0x455367(0x1dd),null),__decorate([(0x0,common_1[_0x455367(0x1e0)])(_0x455367(0x1ee)),(0x0,swagger_1['ApiOperation'])({'summary':_0x455367(0x1df)}),__metadata('design:type',Function),__metadata(_0x455367(0x1fd),[]),__metadata(_0x455367(0x1e1),void 0x0)],ModelsController['prototype'],'modelsList',null),__decorate([(0x0,common_1['Get'])(_0x455367(0x20a)),(0x0,swagger_1['ApiOperation'])({'summary':'客户端查询当前已经配置模型的基础配置'}),__metadata(_0x455367(0x1f5),Function),__metadata(_0x455367(0x1fd),[]),__metadata('design:returntype',void 0x0)],ModelsController[_0x455367(0x202)],_0x455367(0x20a),null),__decorate([(0x0,common_1[_0x455367(0x1e0)])('queryModelType'),(0x0,swagger_1['ApiOperation'])({'summary':'查询模型类型'}),__param(0x0,(0x0,common_1[_0x455367(0x20d)])()),__metadata('design:type',Function),__metadata('design:paramtypes',[queryModelType_dto_1[_0x455367(0x1da)]]),__metadata(_0x455367(0x1e1),void 0x0)],ModelsController[_0x455367(0x202)],'queryModelType',null),__decorate([(0x0,common_1[_0x455367(0x1d5)])(_0x455367(0x213)),(0x0,swagger_1[_0x455367(0x1d8)])({'summary':_0x455367(0x207)}),(0x0,common_1[_0x455367(0x1e8)])(superAuth_guard_1[_0x455367(0x20e)]),(0x0,swagger_1['ApiBearerAuth'])(),__param(0x0,(0x0,common_1[_0x455367(0x1f0)])()),__metadata('design:type',Function),__metadata(_0x455367(0x1fd),[setModelType_dto_1[_0x455367(0x209)]]),__metadata(_0x455367(0x1e1),void 0x0)],ModelsController['prototype'],_0x455367(0x213),null),__decorate([(0x0,common_1[_0x455367(0x1d5)])('delModelType'),(0x0,swagger_1['ApiOperation'])({'summary':'删除模型类型'}),(0x0,common_1[_0x455367(0x1e8)])(superAuth_guard_1[_0x455367(0x20e)]),(0x0,swagger_1[_0x455367(0x1e2)])(),__param(0x0,(0x0,common_1[_0x455367(0x1f0)])()),__metadata(_0x455367(0x1f5),Function),__metadata(_0x455367(0x1fd),[Object]),__metadata(_0x455367(0x1e1),void 0x0)],ModelsController[_0x455367(0x202)],_0x455367(0x1ea),null),ModelsController=__decorate([(0x0,common_1[_0x455367(0x204)])('models'),__metadata(_0x455367(0x1fd),[models_service_1['ModelsService']])],ModelsController),exports[_0x455367(0x1f2)]=ModelsController;