import mongoose from 'mongoose';

const serviceItemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  shortDesc: { type: String, required: true, trim: true },
  image: { type: String, required: true, trim: true },
  longDesc: { type: String, default: '', trim: true }
}, { _id: false });

const serviceContentSchema = new mongoose.Schema({
  services: {
    type: [serviceItemSchema],
    default: [
      {
        title: '모델링',
        shortDesc: '사실적이고 디테일하며 엔지니어링 중심의 현실적인 모델링을 제공합니다.',
        image: 'assets/service-building.png',
        longDesc: '건축·인테리어 등 다양한 분야의 3D 모델을 제작합니다. 설계 도면과 의도를 반영한 사실적인 표현으로 검토와 의사결정을 지원합니다.'
      },
      {
        title: '3D시뮬레이션, 프레젠테이션',
        shortDesc: '최신기술이 접목된 소개영상 및 프레젠테이션을 통해 회의를 성공적으로 이끕니다.',
        image: 'assets/service-presentation.png',
        longDesc: '이목이 집중되는 애니메이션을 접목한 프로젝트 보고요약 및 소개 영상을 제작합니다. 회의와 제안 시 시각 자료로 활용할 수 있어 효과적인 커뮤니케이션을 돕습니다.'
      },
      {
        title: 'AR기술 지원',
        shortDesc: 'AR비전을 통해 분야별 기술을 현실공간에 표현해 합리적인 협의결과를 도출합니다.',
        image: 'assets/service-ar.png',
        longDesc: '증강현실(AR)을 활용해 공간·제품을 실제 환경에서 확인할 수 있도록 합니다. 현장 검토와 클라이언트 협의 시 활용 가능합니다.'
      }
    ]
  }
}, { timestamps: true });

const ServiceContent = mongoose.model('ServiceContent', serviceContentSchema);

export default ServiceContent;
